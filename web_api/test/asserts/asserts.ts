import { expect } from "vitest";
import { HoFetchStatusError, HoResponse } from "@asla/hofetch";

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
  async responseStatus(
    received: Response | HoResponse | HoFetchStatusError | Promise<Response | HoFetchStatusError>,
    expected,
  ) {
    if (received instanceof Promise) received = await received.catch((e) => e);
    let status: number;
    if (received instanceof HoFetchStatusError) {
      status = received.status;
    } else if (received instanceof Response) {
      status = received.status;
    } else if (received instanceof HoResponse) {
      status = received.status;
    } else {
      return {
        pass: false,
        message() {
          return `不是 Response 或 HoFetchStatusError 对象`;
        },
        expected: "Expected return Response or HoFetchStatusError",
        actual: typeof received === "object" ? received?.constructor?.name : received,
      };
    }

    if (status !== expected) {
      return {
        pass: false,
        message() {
          return `Expected response status is ${expected}`;
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
  throwErrorMatchBody: (status: number, value: any) => Promise<Awaited<R>>;
  throwErrorEqualBody: (status: number, value: any) => Promise<Awaited<R>>;
  responseStatus: (value: number) => Promise<Awaited<R>>;
}

declare module "vitest" {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
