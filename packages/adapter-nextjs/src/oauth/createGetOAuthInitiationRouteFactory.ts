import {
	assertOAuthConfig,
	assertTokenProviderConfig,
} from '@aws-amplify/core/internals/utils';

import {
	CreateGetOAuthInitiationRouteFactory,
	GetOAuthInitiationRoute,
} from './types';
import { getRedirectUrl } from './utils/getRedirectUrl';

export const createGetOAuthInitiationRouteFactory: CreateGetOAuthInitiationRouteFactory =
	({ config: resourcesConfig, origin }) => {
		const getOAuthInitiationRoute: GetOAuthInitiationRoute = input => {
			assertTokenProviderConfig(resourcesConfig.Auth?.Cognito);
			assertOAuthConfig(resourcesConfig.Auth.Cognito);

			const { Cognito: cognitoUserPoolConfig } = resourcesConfig.Auth;
			if (!origin) {
				throw new Error(
					'`origin` parameter is required when using `getOAuthInitiationRoute`.',
				);
			}

			const redirectUrl = getRedirectUrl(
				origin,
				cognitoUserPoolConfig.loginWith.oauth,
			);
			const { provider } = input;

			return `${redirectUrl}?init=true&provider=${provider}`;
		};

		return getOAuthInitiationRoute;
	};
