import NodeCache from 'node-cache';
import requestPromise from 'request-promise-native';

const myCache = new NodeCache();
const key = 'authToken';
const expirationSeconds = 7 * 24 * 60 * 60; // 7 days
const apiBaseUrl = "https://api-prod.messagecentral.com";
const customerId = process.env.CUSTOMER_ID;

interface OTPResponse {
  success: boolean;
  otpToken?: string;
  timestamp?: number;
  error?: string;
}

interface VerifyOTPResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Store a string in the cache with an expiration time.
 */
function storeStringWithExpiration(key: string, value: string, expirationSeconds: number): void {
  const expirationTime = expirationSeconds * 1000;
  myCache.set(key, value, expirationTime);

  setTimeout(() => {
    myCache.del(key);
    console.log(`Key '${key}' expired and was removed from the cache.`);
  }, expirationTime);
}

/**
 * Retrieve a string from the cache.
 */
function getStringFromCache(key: string): string | undefined {
  return myCache.get(key);
}

/**
 * Fetch an authentication token from the OTP API.
 */
const getAuthToken = async (): Promise<string> => {
  let authToken = getStringFromCache(key);

  if (!authToken) {
    const options = {
      method: 'GET',
      uri: `${apiBaseUrl}/auth/v1/authentication/token?country=IN&customerId=${customerId}&key=${process.env.BASE_64_PWD}&scope=NEW`,
      headers: {
        accept: '*/*',
      },
    };

    try {
      const response = await requestPromise(options);
      const token = JSON.parse(response).token;
      storeStringWithExpiration(key, token, expirationSeconds);
      authToken = token;
      console.log('Auth token stored in cache:', authToken);
    } catch (error) {
      throw new Error(`Failed to fetch auth token: ${error}`);
    }
  }

  return authToken as string;
};

/**
 * Send an OTP to the provided phone number.
 */
export const sendOtp = async (phoneNumber: string): Promise<OTPResponse> => {
  try {
    const authToken = await getAuthToken();

    const options = {
      method: 'POST',
      uri: `${apiBaseUrl}/verification/v2/verification/send?countryCode=91&customerId=${customerId}&flowType=SMS&mobileNumber=${phoneNumber}`,
      headers: {
        authToken,
      },
      json: true,
    };

    const response = await requestPromise(options);
    console.log("OTP API Response:", response); // Debugging log
    return {
      success: true,
      otpToken: response.data.verificationId,
      timestamp: response.data.timestamp,
    };
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Verify the OTP provided by the user.
 */
export const verifyOtp = async (
  phoneNumber: string,
  otp: string,
  otpToken: string,
  // timestamp: number
): Promise<VerifyOTPResponse> => {
  try {
    const authToken = await getAuthToken();

    const options = {
      method: 'GET',
      uri: `${apiBaseUrl}/verification/v2/verification/validateOtp?countryCode=91&mobileNumber=${phoneNumber}&verificationId=${otpToken}&customerId=${customerId}&code=${otp}`,
      headers: {
        authToken,
      },
      json: true,
    };

    const response = await requestPromise(options);
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};