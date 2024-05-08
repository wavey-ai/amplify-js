// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
	AuthProvider,
	cognitoHostedUIIdentityProviderMap,
	createKeyValueStorageFromCookieStorageAdapter,
	generateCodeVerifier,
	generateState,
} from 'aws-amplify/adapter-core';
import { NextRequest, NextResponse } from 'next/server.js';
import { urlSafeEncode } from '@aws-amplify/core/internals/utils';
import { CognitoUserPoolConfig, OAuthConfig } from '@aws-amplify/core';
import { DefaultOAuthStore } from '@aws-amplify/auth/cognito';

import { createCookieStorageAdapterFromNextServerContext } from '../../utils/createCookieStorageAdapterFromNextServerContext';
import { NextServer } from '../../types';

import { getRedirectUrl } from './getRedirectUrl';

export const initOAuthFlow = async ({
	request,
	customState,
	cognitoUserPoolConfig,
	oAuthConfig,
	setAuthCookieOptions,
}: {
	request: NextRequest;
	customState: string | undefined;
	cognitoUserPoolConfig: CognitoUserPoolConfig;
	oAuthConfig: OAuthConfig;
	setAuthCookieOptions?: NextServer.SetCookieOptions;
}): Promise<Response> => {
	const { searchParams } = request.nextUrl;
	const specifiedProvider = searchParams.get('provider');
	const provider = getProvider(specifiedProvider);
	const randomState = generateState();
	const state = customState
		? `${randomState}-${urlSafeEncode(customState)}`
		: randomState;
	const scope = oAuthConfig.scopes.join(' ');

	const redirectUrlSearchParams = new URLSearchParams({
		redirect_uri: getRedirectUrl(request.nextUrl.origin, oAuthConfig),
		response_type: oAuthConfig.responseType,
		client_id: cognitoUserPoolConfig.userPoolClientId!,
		identity_provider: provider,
		scope,
		state,
	});

	let peckKey: string | undefined;

	if (oAuthConfig.responseType === 'code') {
		const { value, method, toCodeChallenge } = generateCodeVerifier(128);

		peckKey = value;
		redirectUrlSearchParams.append('code_challenge', toCodeChallenge());
		redirectUrlSearchParams.append('code_challenge_method', method);
	}

	const redirectUrl = new URL(
		`https://${
			oAuthConfig.domain
		}/oauth2/authorize?${redirectUrlSearchParams.toString()}`,
	);

	const response = NextResponse.redirect(redirectUrl);
	const keyValueStorage = createKeyValueStorageFromCookieStorageAdapter(
		createCookieStorageAdapterFromNextServerContext({
			request,
			response,
		}),
		setAuthCookieOptions,
	);
	const oauthStore = new DefaultOAuthStore(keyValueStorage);
	oauthStore.setAuthConfig(cognitoUserPoolConfig);
	oauthStore.storeOAuthState(state);
	peckKey && oauthStore.storePKCE(peckKey);

	return response;
};

const getProvider = (provider: string | null): string => {
	if (typeof provider === 'string') {
		return resolveProvider(provider);
	}

	return 'COGNITO';
};

const resolveProvider = (provider: string): string => {
	try {
		assertAuthProvider(provider);

		return cognitoHostedUIIdentityProviderMap[provider];
	} catch (_) {
		return provider;
	}
};

function assertAuthProvider(
	provider: string,
): asserts provider is AuthProvider {
	if (!['Amazon', 'Apple', 'Facebook', 'Google'].includes(provider)) {
		throw new Error('No valid provider specified.');
	}
}
