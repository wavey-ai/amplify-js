import { NextRequest } from 'next/server.js';
import { cookies } from 'next/headers.js';
import { fetchAuthSession } from 'aws-amplify/auth/server';

import { createRunWithAmplifyServerContext } from '../utils';

import {
	CreateTokenExchangeRouteHandlerFactory,
	CreateTokenExchangeRouteHandlerInput,
} from './types';

export const createTokenExchangeRouteHandlerFactory: CreateTokenExchangeRouteHandlerFactory =
	input => {
		const runWithAmplifyServerContext =
			createRunWithAmplifyServerContext(input);

		const handleRequest = async (
			_: NextRequest,
			__: CreateTokenExchangeRouteHandlerInput,
		) => {
			const { origin } = input;

			if (!origin) {
				throw new Error(
					'`origin` parameter is required when using `getOAuthInitiationRoute`.',
				);
			}

			const userSession = await runWithAmplifyServerContext({
				nextServerContext: { cookies },
				operation: contextSpec => fetchAuthSession(contextSpec),
			});

			const clockDrift = cookies()
				.getAll()
				.find(cookie => cookie.name.endsWith('.clockDrift'))?.value;

			return new Response(
				JSON.stringify({
					...userSession,
					tokens: {
						accessToken: userSession.tokens?.accessToken.toString(),
						idToken: userSession.tokens?.idToken?.toString(),
					},
					username: userSession.tokens?.accessToken.payload.username,
					clockDrift,
					userSession,
				}),
				{
					headers: {
						'content-type': 'application/json',
						'Access-Control-Allow-Origin': origin,
						'Access-Control-Allow-Methods': 'POST',
					},
				},
			);
		};

		return handlerInput => ({
			async POST(request) {
				try {
					return await handleRequest(request, handlerInput);
				} catch (error) {
					const { onError } = handlerInput;

					onError(error as Error);
				}
			},
		});
	};
