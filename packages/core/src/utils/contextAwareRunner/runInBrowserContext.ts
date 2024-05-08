// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { isBrowser } from '../isBrowser';

export const runInBrowserContext = (fn: () => void) => {
	if (!isBrowser()) {
		return;
	}

	fn();
};
