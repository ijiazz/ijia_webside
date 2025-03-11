import { expect } from "vitest";
import { HoFetchStatusError } from "@asla/hofetch";
async function responseSuccessWith(received: Response, type: "json" | "text", expectedBody: any) {
  expect(received).instanceof(Response);

  let body = null;
  if (received.body) {
    switch (type) {
      case "json":
        body = await received.json();
        break;
      case "text":
        body = await received.text();
      default:
        break;
    }
  }

  try {
    expect(body).toEqual(expectedBody);
  } catch (error) {
    return {
      pass: false,
      message() {
        const raw = error instanceof Error ? error.message : "";
        return "Body is not equal. " + raw;
      },
      expected: expectedBody,
      actual: body,
    };
  }
  return {
    pass: true,
    message() {
      return "";
    },
  };
}
function isError(received: HoFetchStatusError, status: number) {
  if (!(received instanceof HoFetchStatusError)) {
    return {
      pass: false,
      message() {
        return `预期应该是 HoFetchStatusError 的实例`;
      },
      expected: "HoFetchStatusError",
      actual: received,
    };
  }

  if (received.status !== status) {
    return {
      pass: false,
      message() {
        return `expected response.status is ${status}`;
      },
      expected: status,
      actual: received.status,
    };
  }
}
expect.extend({
  responseSuccessWit(received: Response, type: "json" | "text", expectedBody) {
    if (received.status !== 200) {
      return {
        pass: false,
        message() {
          return `expected response.status is 200`;
        },
        expected: 200,
        actual: received.status,
      };
    }
    return responseSuccessWith(received, type, expectedBody);
  },
  async throwErrorEqualBody(received: HoFetchStatusError, status: number, expectedBody) {
    const res = isError(received, status);
    if (res) return res;
    let body = received.body;
    try {
      expect(body).toEqual(expectedBody);
    } catch (error) {
      return {
        pass: false,
        message() {
          const raw = error instanceof Error ? error.message : "";
          return "Body is not equal. " + raw;
        },
        expected: expectedBody,
        actual: body,
      };
    }
    return {
      pass: true,
      message() {
        return "";
      },
    };
  },
  async throwErrorMatchBody(received: HoFetchStatusError, status: number, expectedBody) {
    isError(received, status);
    let body = received.body;
    try {
      expect(body).toMatchObject(expectedBody);
    } catch (error) {
      return {
        pass: false,
        message() {
          const raw = error instanceof Error ? error.message : "";
          return "Body is not match. " + raw;
        },
        expected: expectedBody,
        actual: body,
      };
    }
    return {
      pass: true,
      message() {
        return "";
      },
    };
  },
  async responseStatus(received: Response, expected) {
    let status: number;
    if (received instanceof HoFetchStatusError) {
      status = received.status;
    } else if (received instanceof Response) {
      status = received.status;
    } else {
      return {
        pass: false,
        message() {
          return `不是 Response 对象`;
        },
        expected: expected,
        actual: received,
      };
    }

    if (status !== expected) {
      return {
        pass: false,
        message() {
          return `expected response.status is ${expected}`;
        },
        expected: expected,
        actual: status,
      };
    }

    return {
      pass: true,
      message() {
        return "";
      },
    };
  },
});

interface CustomMatchers<R = unknown> {
  responseSuccessWith: (type: "json" | "text", value: any) => Promise<Awaited<R>>;
  throwErrorMatchBody: (status: number, value: any) => Promise<Awaited<R>>;
  throwErrorEqualBody: (status: number, value: any) => Promise<Awaited<R>>;
  responseStatus: (value: number) => Promise<Awaited<R>>;
}

declare module "vitest" {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
