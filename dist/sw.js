/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-47da91e0'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();

  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "assets/AboutPage-BRc3UFW8.js",
    "revision": null
  }, {
    "url": "assets/AdminChat-FKM4f7La.js",
    "revision": null
  }, {
    "url": "assets/AgentCommissions-CPw3oZUH.js",
    "revision": null
  }, {
    "url": "assets/AgentCustomers-D5cdDb9f.js",
    "revision": null
  }, {
    "url": "assets/AgentDashboard-iKSq9qaH.js",
    "revision": null
  }, {
    "url": "assets/AgentOrders-s1iomWs2.js",
    "revision": null
  }, {
    "url": "assets/AgentPayments-BQVHz2rN.js",
    "revision": null
  }, {
    "url": "assets/Agents-BK7vqK7v.js",
    "revision": null
  }, {
    "url": "assets/CartPage-CJ6Iv_hK.js",
    "revision": null
  }, {
    "url": "assets/chart-vendor-B8xsdVR1.js",
    "revision": null
  }, {
    "url": "assets/Chat-CeYBOp2N.js",
    "revision": null
  }, {
    "url": "assets/ConfirmationModal-BAMqiMtp.js",
    "revision": null
  }, {
    "url": "assets/ContactMessages-B9VYeSn9.js",
    "revision": null
  }, {
    "url": "assets/ContactPage-DOMITnjA.js",
    "revision": null
  }, {
    "url": "assets/ContactReplies-CW934k0z.js",
    "revision": null
  }, {
    "url": "assets/CookiesPage-B1lXHnd5.js",
    "revision": null
  }, {
    "url": "assets/Coupons-DuAaeyHY.js",
    "revision": null
  }, {
    "url": "assets/Dashboard-De7wZ_tu.js",
    "revision": null
  }, {
    "url": "assets/Dashboard-RpuCI0BK.js",
    "revision": null
  }, {
    "url": "assets/helpers-B6CJClH3.js",
    "revision": null
  }, {
    "url": "assets/HomePage-D7yHk0gS.js",
    "revision": null
  }, {
    "url": "assets/icons-DYE8NDaX.js",
    "revision": null
  }, {
    "url": "assets/index-CYRJ5nlH.css",
    "revision": null
  }, {
    "url": "assets/index-Dfjzp2DE.js",
    "revision": null
  }, {
    "url": "assets/Invoices-63zF9gOf.js",
    "revision": null
  }, {
    "url": "assets/LoginPage-DAvKnWp0.js",
    "revision": null
  }, {
    "url": "assets/MyOrders-c57bUZKI.js",
    "revision": null
  }, {
    "url": "assets/OrderDetails-C4cbBBBo.js",
    "revision": null
  }, {
    "url": "assets/OrderPage-VC7vDzCP.js",
    "revision": null
  }, {
    "url": "assets/Orders-Dlcisatr.js",
    "revision": null
  }, {
    "url": "assets/Payments-C-diRL6v.js",
    "revision": null
  }, {
    "url": "assets/PointDashboard-CUU25F8y.js",
    "revision": null
  }, {
    "url": "assets/PointManagerRedirect-DjqBrBzR.js",
    "revision": null
  }, {
    "url": "assets/PointsOfSale-BPg3BPHx.js",
    "revision": null
  }, {
    "url": "assets/PointsPage-CrS4QRQz.js",
    "revision": null
  }, {
    "url": "assets/PrivacyPage-BizTGBXv.js",
    "revision": null
  }, {
    "url": "assets/ProfilePage-CynixppX.js",
    "revision": null
  }, {
    "url": "assets/react-vendor-DBmefE3i.js",
    "revision": null
  }, {
    "url": "assets/RegisterPage-RP0feOh1.js",
    "revision": null
  }, {
    "url": "assets/Reports-DuZCEvsp.js",
    "revision": null
  }, {
    "url": "assets/Roles-ugnUQL2I.js",
    "revision": null
  }, {
    "url": "assets/Settings-D1eywfrd.js",
    "revision": null
  }, {
    "url": "assets/StoresPage-C7Um-TGL.js",
    "revision": null
  }, {
    "url": "assets/TermsPage-C337yOZ4.js",
    "revision": null
  }, {
    "url": "assets/TrackingPage-nJt0nMv5.js",
    "revision": null
  }, {
    "url": "assets/Users-CvXncU3G.js",
    "revision": null
  }, {
    "url": "assets/utils-CZ_YNEkO.js",
    "revision": null
  }, {
    "url": "assets/WalletCodes-CYvH7kVu.js",
    "revision": null
  }, {
    "url": "assets/WalletPage-rOrBftx9.js",
    "revision": null
  }, {
    "url": "assets/Wallets-5TSqOJZp.js",
    "revision": null
  }, {
    "url": "assets/workbox-window.prod.es5-DMXp7Fa7.js",
    "revision": null
  }, {
    "url": "clear-storage.html",
    "revision": "9731b256e87d32e393df5b553c01930c"
  }, {
    "url": "favicon.svg",
    "revision": "fb3b0ba4c529ea91233d892bae8eba7c"
  }, {
    "url": "index.html",
    "revision": "d83b57e5beb56e2b7204d5a52749f637"
  }, {
    "url": "logo-simple.svg",
    "revision": "e534b6aa5fa8881c75321e817cf986bf"
  }, {
    "url": "logo-text.svg",
    "revision": "9b7c42a5fcfcc4ed817d5b1b555a5328"
  }, {
    "url": "logo.svg",
    "revision": "92f222a0f97cf1fe0df6a428b48d5ff9"
  }, {
    "url": "favicon.svg",
    "revision": "fb3b0ba4c529ea91233d892bae8eba7c"
  }, {
    "url": "logo.svg",
    "revision": "92f222a0f97cf1fe0df6a428b48d5ff9"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/, new workbox.CacheFirst({
    "cacheName": "images-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 50,
      maxAgeSeconds: 2592000
    })]
  }), 'GET');
  workbox.registerRoute(/\/api\/.*/i, new workbox.NetworkFirst({
    "cacheName": "api-cache",
    "networkTimeoutSeconds": 10,
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 50,
      maxAgeSeconds: 300
    })]
  }), 'GET');

}));
