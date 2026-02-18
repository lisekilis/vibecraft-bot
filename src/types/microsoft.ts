export interface XboxLiveTokenResponse {
	/**Timestamp when the token was issued*/
	IssueInstant: string;
	/**Timestamp when the token will expire*/
	NotAfter: string;
	/**The token string*/
	Token: string;
	/**Display claims, contains user information*/
	DisplayClaims: {
		/**Xbox user Information*/
		xui: [
			{
				/**User hash, used to identify the user in Xbox Live*/
				uhs: string;
			},
		];
	};
}
export interface XSTSTokenResponse {
	/**Timestamp when the token was issued*/
	IssueInstant: string;
	/**Timestamp when the token will expire*/
	NotAfter: string;
	/**The XSTS token string*/
	Token: string;
	/**Display claims, contains user information*/
	DisplayClaims: {
		/**Xbox user Information*/
		xui: [
			{
				/**User hash, used to identify the user in Xbox Live*/
				uhs: string;
			},
		];
	};
}

export interface MicrosoftErrorResponse {
	/**Identity of the error, usually "0" for account-related errors*/
	Identity: string;
	/**Error code, used to identify the specific error that occurred*/
	XErr: number;
	/**A message describing the error, may be empty*/
	Message: string;
	/**A URL to redirect the user to for more information or to resolve the issue*/
	Redirect: string;
}

export enum XboxLiveErrorCodes {
	AccountBanned = 2148916227,
	AccountNoXbox = 2148916233,
	AccountCountryBanned = 2148916235,
	AccountNeedsAdultVerificationSK = 2148916236,
	AccountNeedsAdultVerificationSK2 = 2148916237,
	AccountChild = 2148916238,
	TBD = 2148916262,
}

export interface MinecraftTokenResponse {
	/**The user's Minecraft username*/
	username: string;
	/**An array of roles associated with the user's Minecraft account, may be empty*/
	roles: string[];
	/**The access token for the Minecraft account, used for authentication in Minecraft services*/
	access_token: string;
	/**The type of token, typically "Bearer"*/
	token_type: string;
	/**The number of seconds until the access token expires*/
	expires_in: number;
}
