import { LibraryOptions, sharedInMemoryStorage } from '@aws-amplify/core';
import { runInBrowserContext } from '@aws-amplify/core/internals/utils';
import {
	cognitoCredentialsProvider,
	cognitoUserPoolsTokenProvider,
} from 'aws-amplify/auth/cognito';

export const createHttpOnlyCookieBasedAuthProviders = ({
	authTokenExchangeRoute,
}: {
	authTokenExchangeRoute: string;
}): LibraryOptions['Auth'] => {
	cognitoUserPoolsTokenProvider.setKeyValueStorage(sharedInMemoryStorage);

	runInBrowserContext(() => {
		refreshSession({
			authTokenExchangeRoute,
			tokenProvider: cognitoUserPoolsTokenProvider,
			credentialsProvider: cognitoCredentialsProvider,
		});
	});

	return {
		tokenProvider: cognitoUserPoolsTokenProvider,
		credentialsProvider: cognitoCredentialsProvider,
	};
};

const refreshSession = async ({
	authTokenExchangeRoute,
	tokenProvider,
	credentialsProvider,
}: {
	authTokenExchangeRoute: string;
	tokenProvider: typeof cognitoUserPoolsTokenProvider;
	credentialsProvider: typeof cognitoCredentialsProvider;
}) => {
	const response = await fetch(authTokenExchangeRoute, { method: 'POST' });
	if (response.status !== 200) {
		return;
	}

	const session = await response.json();

	tokenProvider.tokenOrchestrator.setTokens({
		tokens: {
			accessToken: session.tokens.accessToken,
			idToken: session.tokens.idToken,
			clockDrift: session.clockDrift,
			username: session.username,
		},
	});

	credentialsProvider.setIdentityIdCredentials(
		{
			credentials: session.credentials,
			identityId: session.identityId,
		},
		session.tokens.idToken,
	);
};
