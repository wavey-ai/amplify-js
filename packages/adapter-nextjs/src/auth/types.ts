import { ResourcesConfig } from 'aws-amplify';
import { NextRequest } from 'next/server';

import { NextServer } from '../types';

interface CreateTokenExchangeRouteHandlerFactoryInput {
	config: ResourcesConfig;
	origin?: string;
	setAuthCookieOptions?: NextServer.SetCookieOptions;
}

interface CreateOAuthRouteHandlerOutput {
	POST(request: NextRequest): Promise<Response | void>;
}

export interface CreateTokenExchangeRouteHandlerInput {
	onError(error: Error): void;
}

export type CreateTokenExchangeRouteHandler = (
	input: CreateTokenExchangeRouteHandlerInput,
) => CreateOAuthRouteHandlerOutput;

export type CreateTokenExchangeRouteHandlerFactory = (
	input: CreateTokenExchangeRouteHandlerFactoryInput,
) => CreateTokenExchangeRouteHandler;
