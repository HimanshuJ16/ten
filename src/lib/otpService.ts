import NodeCache from "node-cache"
import requestPromise from "request-promise-native"

const myCache = new NodeCache()
const key = "authToken"
const expirationSeconds = 7 * 24 * 60 * 60 // 7 days
const apiBaseUrl = "https://cpaas.messagecentral.com" // Updated base URL

interface OTPResponse {
  success: boolean
  verificationId?: string
  mobileNumber?: string
  transactionId?: string
  timeout?: string
  error?: string
}

interface VerifyOTPResponse {
  success: boolean
  verificationStatus?: string
  mobileNumber?: string
  transactionId?: string
  error?: string
}

/**
 * Store a string in the cache with an expiration time.
 */
function storeStringWithExpiration(key: string, value: string, expirationSeconds: number): void {
  const expirationTime = expirationSeconds * 1000
  myCache.set(key, value, expirationTime)

  setTimeout(() => {
    myCache.del(key)
    console.log(`Key '${key}' expired and was removed from the cache.`)
  }, expirationTime)
}

/**
 * Retrieve a string from the cache.
 */
function getStringFromCache(key: string): string | undefined {
  return myCache.get(key)
}

/**
 * Fetch an authentication token from the Message Central API.
 */
const getAuthToken = async (): Promise<string> => {
  let authToken = getStringFromCache(key)

  if (!authToken) {
    const customerId = process.env.CUSTOMER_ID
    const base64Password = process.env.BASE_64_PWD

    const options = {
      method: "GET",
      uri: `${apiBaseUrl}/auth/v1/authentication/token`,
      qs: {
        customerId: customerId,
        key: base64Password,
        scope: "NEW",
        country: "91", // Default to India, can be parameterized
        email: process.env.EMAIL || "", // Optional parameter
      },
      headers: {
        accept: "*/*",
      },
    }

    try {
      const response = await requestPromise(options)
      const parsedResponse = JSON.parse(response)

      if (parsedResponse.status === 200 && parsedResponse.token) {
        storeStringWithExpiration(key, parsedResponse.token, expirationSeconds)
        authToken = parsedResponse.token
        console.log("Auth token stored in cache")
      } else {
        throw new Error(`Invalid token response: ${JSON.stringify(parsedResponse)}`)
      }
    } catch (error) {
      throw new Error(`Failed to fetch auth token: ${error}`)
    }
  }

  return authToken as string
}

/**
 * Send an OTP to the provided phone number using VerifyNow API.
 */
export const sendOtp = async (phoneNumber: string, otpLength = 4): Promise<OTPResponse> => {
  try {
    const authToken = await getAuthToken()

    const options = {
      method: "POST",
      uri: `${apiBaseUrl}/verification/v3/send`,
      qs: {
        countryCode: "91", // Default to India, can be parameterized
        flowType: "SMS",
        mobileNumber: phoneNumber,
        otpLength: otpLength,
      },
      headers: {
        authToken,
      },
      json: true,
    }

    const response = await requestPromise(options)
    console.log("OTP API Response:", response) // Debugging log

    if (response.responseCode === 200 && response.message === "SUCCESS") {
      return {
        success: true,
        verificationId: response.data.verificationId,
        mobileNumber: response.data.mobileNumber,
        transactionId: response.data.transactionId,
        timeout: response.data.timeout,
      }
    } else {
      return {
        success: false,
        error: response.data?.errorMessage || "Unknown error occurred",
      }
    }
  } catch (error: any) {
    console.error("Error sending OTP:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Verify the OTP provided by the user.
 */
export const verifyOtp = async (verificationId: string, otp: string, langId = ""): Promise<VerifyOTPResponse> => {
  try {
    const authToken = await getAuthToken()

    const options = {
      method: "GET",
      uri: `${apiBaseUrl}/verification/v3/validateOtp`,
      qs: {
        verificationId: verificationId,
        code: otp,
        langId: langId,
      },
      headers: {
        authToken,
      },
      json: true,
    }

    const response = await requestPromise(options)

    if (response.responseCode === 200 && response.message === "SUCCESS") {
      return {
        success: true,
        verificationStatus: response.data.verificationStatus,
        mobileNumber: response.data.mobileNumber,
        transactionId: response.data.transactionId,
      }
    } else {
      return {
        success: false,
        error: response.data?.errorMessage || "Unknown error occurred",
      }
    }
  } catch (error: any) {
    console.error("Error verifying OTP:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Send an SMS using MessageNow API.
 */
export const sendSms = async (
  phoneNumber: string,
  message: string,
  senderId = "UTOMOB",
  messageType = "PROMOTIONAL",
): Promise<OTPResponse> => {
  try {
    const authToken = await getAuthToken()

    const options = {
      method: "POST",
      uri: `${apiBaseUrl}/verification/v3/send`,
      qs: {
        countryCode: "91", // Default to India, can be parameterized
        flowType: "SMS",
        mobileNumber: phoneNumber,
        senderId: senderId,
        type: "SMS",
        message: message,
        messageType: messageType, // TRANSACTION, PROMOTIONAL, OTP
      },
      headers: {
        authToken,
      },
      json: true,
    }

    const response = await requestPromise(options)
    console.log("SMS API Response:", response) // Debugging log

    if (response.responseCode === 200 && response.message === "SUCCESS") {
      return {
        success: true,
        verificationId: response.data.verificationId,
        mobileNumber: response.data.mobileNumber,
        transactionId: response.data.transactionId,
      }
    } else {
      return {
        success: false,
        error: response.data?.errorMessage || "Unknown error occurred",
      }
    }
  } catch (error: any) {
    console.error("Error sending SMS:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

