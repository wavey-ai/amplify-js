import { Observable } from 'zen-observable-ts';
import { GraphQLResult } from './index';
import { DocumentNode } from 'graphql';
import { GRAPHQL_AUTH_MODE } from '@aws-amplify/auth';

// #region shared API types ... probably to be pulled from core or something later.

export interface GraphQLOptionsV2<T extends string> {
	query: T | DocumentNode;
	variables?: object;
	authMode?: keyof typeof GRAPHQL_AUTH_MODE;
	authToken?: string;
	/**
	 * @deprecated This property should not be used
	 */
	userAgentSuffix?: string; // TODO: remove in v6
}

type UnionKeys<T> = T extends T ? keyof T : never;
type StrictUnionHelper<T, TAll> = T extends any
	? T & Partial<Record<Exclude<UnionKeys<TAll>, keyof T>, undefined>>
	: never;
export type StrictUnion<T> = StrictUnionHelper<T, T>;
export type SimpleAuthMode = {
	authMode?: 'AMAZON_COGNITO_USERPOOLS' | 'API_KEY' | 'AWS_IAM';
};

export type LambdaAuthMode = {
	authMode: 'AWS_LAMBDA';
	authToken: string;
};

export type AuthMode = StrictUnion<SimpleAuthMode | LambdaAuthMode>;

// #endregion

export type GeneratedQuery<InputType, OutputType> = string & {
	__generatedQueryInput: InputType;
	__generatedQueryOutput: OutputType;
};

export type GraphqlQueryOverrides<IN extends {}, OUT extends {}> = {
	variables: IN;
	result: OUT;
};

export type GraphqlQueryParams<
	TYPED_GQL_STRING extends string,
	FALLBACK_TYPES
> = AuthMode & {
	variables: TYPED_GQL_STRING extends GeneratedQuery<infer IN, infer OUT>
		? IN
		: FALLBACK_TYPES extends GraphqlQueryOverrides<infer IN, infer OUT>
		? IN
		: any;
};

export type GraphqlQueryResult<T extends string, S> = T extends GeneratedQuery<
	infer IN,
	infer OUT
>
	? GraphQLResult<OUT>
	: S extends GraphqlQueryOverrides<infer IN, infer OUT>
	? GraphQLResult<OUT>
	: any;

/** GraphQL mutate */

export type GeneratedMutation<InputType, OutputType> = string & {
	__generatedMutationInput: InputType;
	__generatedMutationOutput: OutputType;
};

export type GraphqlMutationParams<
	TYPED_GQL_STRING extends string,
	OVERRIDE_TYPE
> = AuthMode & {
	variables: TYPED_GQL_STRING extends GeneratedMutation<infer IN, infer OUT>
		? IN
		: OVERRIDE_TYPE extends GraphqlQueryOverrides<infer OVERRIDE_IN, infer OUT>
		? OVERRIDE_IN
		: any;
};

export type GraphqlMutationResult<
	TYPED_GQL_STRING extends string,
	FALLBACK_TYPES
> = TYPED_GQL_STRING extends GeneratedMutation<infer IN, infer OUT>
	? GraphQLResult<OUT>
	: FALLBACK_TYPES extends GraphqlQueryOverrides<infer IN, infer OUT>
	? GraphQLResult<OUT>
	: any;

/** GraphQL subscribe */

export type GeneratedSubscription<InputType, OutputType> = string & {
	__generatedSubscriptionInput: InputType;
	__generatedSubscriptionOutput: OutputType;
};

export type GraphqlSubscriptionParams<
	TYPED_GQL_STRING extends string,
	FALLBACK_TYPES
> = AuthMode & {
	variables: TYPED_GQL_STRING extends GeneratedSubscription<infer IN, infer OUT>
		? IN
		: FALLBACK_TYPES extends GraphqlQueryOverrides<infer IN, infer OUT>
		? IN
		: any;
};

export type GraphqlSubscriptionResult<
	TYPED_GQL_STRING extends string,
	FALLBACK_TYPES
> = {
	provider: any;
	value: {
		data: TYPED_GQL_STRING extends GeneratedSubscription<infer IN, infer OUT>
			? OUT
			: FALLBACK_TYPES extends GraphqlQueryOverrides<infer IN, infer OUT>
			? OUT
			: any;
	};
};

export type GraphQLResponseV2<
	FALLBACK_TYPES = unknown,
	TYPED_GQL_STRING extends string = string
> = TYPED_GQL_STRING extends GeneratedQuery<any, any>
	? Promise<GraphqlQueryResult<TYPED_GQL_STRING, FALLBACK_TYPES>>
	: TYPED_GQL_STRING extends GeneratedMutation<any, any>
	? Promise<GraphqlMutationResult<TYPED_GQL_STRING, FALLBACK_TYPES>>
	: TYPED_GQL_STRING extends GeneratedSubscription<any, any>
	? Observable<GraphqlSubscriptionResult<TYPED_GQL_STRING, FALLBACK_TYPES>>
	: Promise<GraphQLResult<any>> | Observable<object>;
