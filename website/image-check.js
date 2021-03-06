/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const glob = require("glob-promise");
const fs = require("fs-extra");
const path = require("path");
const Promise = require("bluebird");
const siteConfig = require("./siteConfig");

const imageReferenceRegExp = new RegExp(/!\[.*?\]\((.*)\)/g);

let missingAssets = [];
let queue = Promise.resolve();
glob("../docs/**/*.md")
  .then(files => {
    files.forEach(file => {
      queue = queue
        .then(() => {
          return fs.readFile(file);
        })
        .then(contents => {
          let matches;
          while ((matches = imageReferenceRegExp.exec(contents))) {
            const pathToFile = path.join(
              "..",
              matches[1].replace(siteConfig.baseUrl, "")
            );
            missingAssets.push({ imagePath: pathToFile, markdownPath: file });
          }
        });
    });
    return queue;
  })
  .then(() => {
    queue = Promise.resolve();
    missingAssets.forEach(missingAsset => {
      const { imagePath, markdownPath } = missingAsset;
      queue = queue
        .then(() => {
          return fs.stat(imagePath);
        })
        .then(stats => {})
        .catch(e => {
          console.error(
            "Could not find " +
              imagePath +
              " which has at least one reference in " +
              markdownPath +
              ". Did you forget to add the asset to '/docs/assets'?"
          );
        });
    });
    return queue;
  });
