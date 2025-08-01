import fetch, { Response, Request, Headers } from 'node-fetch';

(global as any).fetch = fetch;
(global as any).Response = Response;
(global as any).Request = Request;
(global as any).Headers = Headers;

import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv({
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true,
});
