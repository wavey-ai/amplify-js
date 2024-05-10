// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
	assertOAuthConfig,
	assertTokenProviderConfig,
} from '@aws-amplify/core/internals/utils';
import { NextRequest } from 'next/server';
import { AuthError } from '@aws-amplify/auth';

import {
	CreateOAuthRouteHandler,
	CreateOAuthRouteHandlerFactory,
	CreateOAuthRouteHandlerInput,
} from './types';
import { initOAuthFlow } from './utils/initOAuthFlow';
import { completeOAuthFlow } from './utils/completeOAuthFlow';

export const createOAuthRouteHandlerFactory: CreateOAuthRouteHandlerFactory = ({
	config: resourcesConfig,
	origin,
	setAuthCookieOptions,
}): CreateOAuthRouteHandler => {
	const handleRequest = async (
		request: NextRequest,
		{
			customState,
			redirectOnAuthComplete,
			onError,
		}: CreateOAuthRouteHandlerInput,
	): Promise<Response | void> => {
		if (!origin) throw new Error('Origin is not provided');
		assertTokenProviderConfig(resourcesConfig.Auth?.Cognito);
		assertOAuthConfig(resourcesConfig.Auth.Cognito);

		const { Cognito: cognitoUserPoolConfig } = resourcesConfig.Auth;
		const { searchParams } = request.nextUrl;

		// when request url has `init` query param - initiate oauth flow
		if (searchParams.has('init')) {
			return initOAuthFlow({
				origin,
				setAuthCookieOptions,
				request,
				customState,
				cognitoUserPoolConfig,
				oAuthConfig: cognitoUserPoolConfig.loginWith.oauth,
			});
		}

		if (searchParams.has('code') && searchParams.has('state')) {
			return completeOAuthFlow({
				origin,
				request,
				redirectOnComplete: redirectOnAuthComplete,
				setAuthCookieOptions,
				customState,
				cognitoUserPoolConfig,
				oAuthConfig: cognitoUserPoolConfig.loginWith.oauth,
			});
		}

		onError(new Error('Invalid point (update me)'));
	};

	return handlerInput => ({
		async GET(request) {
			try {
				return await handleRequest(request, handlerInput);
			} catch (error) {
				const { onError } = handlerInput;

				onError(error as AuthError);
			}
		},
	});
};
