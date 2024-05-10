import {
	CognitoUserPoolConfig,
	OAuthConfig,
	decodeJWT,
} from '@aws-amplify/core';
import { NextRequest, NextResponse } from 'next/server.js';
import {
	createKeyValueStorageFromCookieStorageAdapter,
	validateState,
} from 'aws-amplify/adapter-core';
import {
	AuthenticationResultType,
	CognitoAuthSignInDetails,
	DefaultOAuthStore,
	DefaultTokenStore,
	DeviceMetadata,
	TokenOrchestrator,
} from '@aws-amplify/auth/cognito';

import { NextServer } from '../../types';
import { createCookieStorageAdapterFromNextServerContext } from '../../utils/createCookieStorageAdapterFromNextServerContext';

import { getRedirectUrl } from './getRedirectUrl';

export const completeOAuthFlow = async ({
	origin,
	request,
	redirectOnComplete,
	cognitoUserPoolConfig,
	oAuthConfig,
	setAuthCookieOptions,
}: {
	origin: string;
	request: NextRequest;
	customState: string | undefined;
	redirectOnComplete: string;
	cognitoUserPoolConfig: CognitoUserPoolConfig;
	oAuthConfig: OAuthConfig;
	setAuthCookieOptions?: NextServer.SetCookieOptions;
}): Promise<Response> => {
	const { searchParams } = request.nextUrl;
	const code = searchParams.get('code')!;
	const state = searchParams.get('state')!;

	const oAuthTokenEndpoint = `https://${oAuthConfig.domain}/oauth2/token`;

	const response = NextResponse.redirect(
		new URL(redirectOnComplete, request.url),
	);

	const keyValueStorage = createKeyValueStorageFromCookieStorageAdapter(
		createCookieStorageAdapterFromNextServerContext({
			request,
			response,
		}),
		setAuthCookieOptions,
	);
	const oAuthStore = new DefaultOAuthStore(keyValueStorage);
	oAuthStore.setAuthConfig(cognitoUserPoolConfig);

	await validateState(oAuthStore, state);

	const authTokenStore = new DefaultTokenStore();
	authTokenStore.setAuthConfig({ Cognito: cognitoUserPoolConfig });
	authTokenStore.setKeyValueStorage(keyValueStorage);
	const tokenOrchestrator = new TokenOrchestrator();
	tokenOrchestrator.setAuthConfig({ Cognito: cognitoUserPoolConfig });
	tokenOrchestrator.setAuthTokenStore(authTokenStore);

	const codeVerifier = await oAuthStore.loadPKCE();

	const oAuthTokenBody = {
		grant_type: 'authorization_code',
		code,
		client_id: cognitoUserPoolConfig.userPoolClientId,
		// TODO(Hui): request.nextUrl.origin should be generic and not use Next specifics
		redirect_uri: getRedirectUrl(origin, oAuthConfig),
		...(codeVerifier ? { code_verifier: codeVerifier } : {}),
	};

	const body = Object.entries(oAuthTokenBody)
		.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
		.join('&');

	const tokenExchangeResponse = await fetch(oAuthTokenEndpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body,
	});

	const {
		access_token,
		refresh_token: refreshToken,
		id_token,
		error,
		error_message: errorMessage,
		token_type,
		expires_in,
	} = await tokenExchangeResponse.json();

	if (error) {
		throw new Error(errorMessage ?? error);
	}

	const username =
		(access_token && decodeJWT(access_token).payload.username) ?? 'username';

	await writeTokensToStorage(
		{
			username,
			AccessToken: access_token,
			IdToken: id_token,
			RefreshToken: refreshToken,
			TokenType: token_type,
			ExpiresIn: expires_in,
		},
		tokenOrchestrator,
	);

	await oAuthStore.clearOAuthData();

	return response;
};

const writeTokensToStorage = async (
	payload: AuthenticationResultType & {
		NewDeviceMetadata?: DeviceMetadata;
		username: string;
		signInDetails?: CognitoAuthSignInDetails;
	},
	tokenOrchestrator: TokenOrchestrator,
) => {
	if (!payload.AccessToken) {
		return;
	}

	const accessToken = decodeJWT(payload.AccessToken);
	const accessTokenIssuedAtInMillis = (accessToken.payload.iat || 0) * 1000;
	const currentTime = new Date().getTime();
	const clockDrift =
		accessTokenIssuedAtInMillis > 0
			? accessTokenIssuedAtInMillis - currentTime
			: 0;
	let idToken;
	let refreshToken: string | undefined;
	let deviceMetadata;

	if (payload.RefreshToken) {
		refreshToken = payload.RefreshToken;
	}

	if (payload.IdToken) {
		idToken = decodeJWT(payload.IdToken);
	}

	if (payload?.NewDeviceMetadata) {
		deviceMetadata = payload.NewDeviceMetadata;
	}

	const tokens: any = {
		accessToken,
		idToken,
		refreshToken,
		clockDrift,
		deviceMetadata,
		username: payload.username,
	};

	if (payload?.signInDetails) {
		tokens.signInDetails = payload.signInDetails;
	}

	await tokenOrchestrator.setTokens({ tokens });
};
