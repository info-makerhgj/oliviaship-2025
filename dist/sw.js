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
    "url": "assets/AboutPage-Dx33qmxc.js",
    "revision": null
  }, {
    "url": "assets/AdminChat-4HJAqNSR.js",
    "revision": null
  }, {
    "url": "assets/AgentCommissions-DW-tTDZX.js",
    "revision": null
  }, {
    "url": "assets/AgentCustomers-EdUaZZKH.js",
    "revision": null
  }, {
    "url": "assets/AgentDashboard-BGi35EwS.js",
    "revision": null
  }, {
    "url": "assets/AgentOrders-BBfqWHpc.js",
    "revision": null
  }, {
    "url": "assets/AgentPayments-CYnQeJUJ.js",
    "revision": null
  }, {
    "url": "assets/Agents-y1FUgou3.js",
    "revision": null
  }, {
    "url": "assets/CartPage-DwHh_tQw.js",
    "revision": null
  }, {
    "url": "assets/chart-vendor-B8xsdVR1.js",
    "revision": null
  }, {
    "url": "assets/Chat-BuaqQkHy.js",
    "revision": null
  }, {
    "url": "assets/ConfirmationModal-CSfngUgU.js",
    "revision": null
  }, {
    "url": "assets/ContactMessages-IQm0nZKk.js",
    "revision": null
  }, {
    "url": "assets/ContactPage-BVblsquY.js",
    "revision": null
  }, {
    "url": "assets/ContactReplies-CfORVSjv.js",
    "revision": null
  }, {
    "url": "assets/CookiesPage-BsyPIP2T.js",
    "revision": null
  }, {
    "url": "assets/Coupons-nCgrlkKu.js",
    "revision": null
  }, {
    "url": "assets/Dashboard-BC27agKc.js",
    "revision": null
  }, {
    "url": "assets/Dashboard-C_MpZZPJ.js",
    "revision": null
  }, {
    "url": "assets/helpers-B6CJClH3.js",
    "revision": null
  }, {
    "url": "assets/HomePage-D8NUpE-c.js",
    "revision": null
  }, {
    "url": "assets/icons-DYE8NDaX.js",
    "revision": null
  }, {
    "url": "assets/index-b47YYOPl.js",
    "revision": null
  }, {
    "url": "assets/index-DZ3G8Qja.css",
    "revision": null
  }, {
    "url": "assets/Invoices-DC2nM49D.js",
    "revision": null
  }, {
    "url": "assets/LoginPage-DDVwMhl_.js",
    "revision": null
  }, {
    "url": "assets/MyOrders-BjTkefx-.js",
    "revision": null
  }, {
    "url": "assets/OrderDetails-BiTM5i-X.js",
    "revision": null
  }, {
    "url": "assets/OrderPage-A_FC1IdJ.js",
    "revision": null
  }, {
    "url": "assets/Orders-DixR5YmF.js",
    "revision": null
  }, {
    "url": "assets/Payments-BoohZTQm.js",
    "revision": null
  }, {
    "url": "assets/PointDashboard-BdX7q4mR.js",
    "revision": null
  }, {
    "url": "assets/PointManagerRedirect-C8P8PuMu.js",
    "revision": null
  }, {
    "url": "assets/PointsOfSale-DtnagVBp.js",
    "revision": null
  }, {
    "url": "assets/PointsPage-Bijuwe0p.js",
    "revision": null
  }, {
    "url": "assets/PrivacyPage-IlDjSuXn.js",
    "revision": null
  }, {
    "url": "assets/ProfilePage-BGpJz6DJ.js",
    "revision": null
  }, {
    "url": "assets/react-vendor-DBmefE3i.js",
    "revision": null
  }, {
    "url": "assets/RegisterPage-RquNc29N.js",
    "revision": null
  }, {
    "url": "assets/Reports-CAG-B-2y.js",
    "revision": null
  }, {
    "url": "assets/Roles--42qsqe4.js",
    "revision": null
  }, {
    "url": "assets/Settings-DYKUsFuW.js",
    "revision": null
  }, {
    "url": "assets/StoresPage-DS20chmh.js",
    "revision": null
  }, {
    "url": "assets/TermsPage-Jh9obQwK.js",
    "revision": null
  }, {
    "url": "assets/TrackingPage-QUS35q6g.js",
    "revision": null
  }, {
    "url": "assets/Users-DsmDOa0i.js",
    "revision": null
  }, {
    "url": "assets/utils-CZ_YNEkO.js",
    "revision": null
  }, {
    "url": "assets/WalletCodes-rSG1fDhd.js",
    "revision": null
  }, {
    "url": "assets/WalletPage-B7YTH7h5.js",
    "revision": null
  }, {
    "url": "assets/Wallets-DNa7kKiQ.js",
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
    "revision": "16c92a9995ded86297a9430ef998ab74"
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
