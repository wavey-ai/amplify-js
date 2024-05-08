// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { AuthError, AuthProvider } from '@aws-amplify/auth';
import { ResourcesConfig } from 'aws-amplify';
import { NextRequest } from 'next/server';

import { NextServer } from '../types';

export interface CreateOAuthRouteHandlerInput {
	/** A custom state identifying an OAuth flow. */
	customState?: string;

	/** The path to redirect to when an OAuth flow completes. */
	redirectOnAuthComplete: string;

	/**
	 * A callback function to be called with a {@link AuthError} object that thrown
	 * from an inflight OAuth flow when error occurs. You need to return a
	 * {@link Response} object to redirect end user away from the API route
	 * you set up, for example, redirect back to the sign in page by
	 * `return NextResponse.redirect('/sign-in')`.
	 */
	onError(error: AuthError): void;
}

interface CreateOAuthRouteHandlerOutput {
	GET(request: NextRequest): Promise<Response | void>;
}

export type CreateOAuthRouteHandler = (
	input: CreateOAuthRouteHandlerInput,
) => CreateOAuthRouteHandlerOutput;

interface CreateOAuthRouteHandlerFactoryInput {
	config: ResourcesConfig;
	setAuthCookieOptions?: NextServer.SetCookieOptions;
}

export type CreateOAuthRouteHandlerFactory = (
	input: CreateOAuthRouteHandlerFactoryInput,
) => CreateOAuthRouteHandler;

export type GetOAuthInitiationRoute = (input: {
	provider:
		| AuthProvider
		| {
				custom: string;
		  };
}) => string;

interface CreateGetOAuthInitiationRouteFactoryInput {
	config: ResourcesConfig;
	origin?: string;
}

export type CreateGetOAuthInitiationRouteFactory = (
	input: CreateGetOAuthInitiationRouteFactoryInput,
) => GetOAuthInitiationRoute;
