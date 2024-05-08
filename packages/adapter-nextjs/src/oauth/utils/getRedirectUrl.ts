// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { AuthError } from '@aws-amplify/auth';
import { OAuthConfig } from '@aws-amplify/core';

export const getRedirectUrl = (origin: string, oAuthConfig: OAuthConfig) => {
	const redirectUrl = oAuthConfig.redirectSignIn.find(url =>
		url.startsWith(origin),
	);

	if (!redirectUrl) {
		throw new AuthError({
			name: 'InvalidRedirectException',
			message:
				'signInRedirect or signOutRedirect had an invalid format or was not found.',
			recoverySuggestion:
				'Please make sure the signIn/Out redirect in your oauth config is valid.',
		});
	}

	return redirectUrl;
};
