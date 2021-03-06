"use strict";

// TODO: Add subscriber and remove subscriber when an app is favorited, also change the CLI and UI to only show
// in their main list (aka apps) to show just the favorites with an option to show all.
/*
  m.Get("/v1/space/:space/app/:app/subscribers", app.GetSubscribersDB)
  m.Delete("/v1/space/:space/app/:app/subscriber", binding.Json(structs.Subscriberspec{}), app.RemoveSubscriberDB)
  m.Post("/v1/space/:space/app/:app/subscriber", binding.Json(structs.Subscriberspec{}), app.AddSubscriberDB)
*/

const fs = require('fs');
const query = require('./query.js');
const httph = require('./http_helper.js');
const uuid = require('uuid');
const common = require('./common.js');

function to_response(favorite) {
  return {
    id:favorite.favorite,
    app:favorite.app,
    simple_name: favorite.app_name,
    name: favorite.app_name + '-' + favorite.space_name,
    git_url: favorite.repo,
    web_url: favorite.url,
    organization: { name: favorite.org_name },
    deleted: favorite.deleted,
    created_at:favorite.created.toISOString(),
    updated_at:favorite.updated.toISOString()
  }
}

let select_favorites = query.bind(query, fs.readFileSync('./sql/select_favorites.sql').toString('utf8'), to_response);
let select_favorite = query.bind(query, fs.readFileSync('./sql/select_favorite.sql').toString('utf8'), to_response);
let delete_favorite = query.bind(query, fs.readFileSync('./sql/delete_favorite.sql').toString('utf8'), to_response);
let create_favorite = query.bind(query, fs.readFileSync('./sql/insert_favorite.sql').toString('utf8'), to_response);
let update_favorite = query.bind(query, fs.readFileSync('./sql/update_favorite.sql').toString('utf8'), to_response);


async function favorites_list(pg_pool, req, res, regex) {
  if (req && req.headers && req.headers['x-username']) {
    var username = req.headers['x-username'];
    let favorites = await select_favorites(pg_pool, [username])
    return httph.ok_response(res, JSON.stringify(favorites));
  } else {
    throw new common.NotAllowedError()
  }
}

async function favorites_del(pg_pool, req, res, regex){
  if (req && req.headers && req.headers['x-username']) {
    let app_key = httph.first_match(req.url, regex)
    let app = await common.app_exists(pg_pool, app_key) //(exists, app_uuid, app_name, space_name, org, quantity, url) => {
    let username = req.headers['x-username'];
    let favorites = delete_favorite(pg_pool, [app.app_uuid, username])//, (favorites) => {
    if(favorites.length === 0) {
      throw new common.NotFoundError(`The specified favorite was not found (${app_key}) for given user.`)
    }
    return httph.no_content_response(res, JSON.stringify(favorites));
  } else {
    throw new common.NotAllowedError()
  }
}

async function favorites_create(pg_pool, req, res, regex) {
  if (req && req.headers && req.headers['x-username']) {
    let username = req.headers['x-username']
    let payload = await httph.buffer_json(req)
    let app = await common.app_exists(pg_pool, payload.app)
    let created_updated = new Date();
    let favorites = await select_favorite(pg_pool, [username, app.app_uuid])
    if(favorites.length > 0) {
      if(favorites[0].deleted) {
        favorites = await update_favorite(pg_pool, [created_updated, favorites[0].id])
        if(favorites.length === 0) {
          throw new common.NotFoundError(`The specified favorite was not found for this user.`)
        }
      }
      return httph.created_response(res, JSON.stringify(favorites[0]));
    }
    let favorite_id = uuid.v4();
    await create_favorite(pg_pool, [favorite_id, username, app.app_uuid, false, created_updated, created_updated])
    favorites = await select_favorite(pg_pool, [username, app.app_uuid])
    return httph.created_response(res, JSON.stringify(favorites[0]));
  } else {
    throw new common.NotAllowedError()
  }
}

module.exports = {
  list: favorites_list,
  delete: favorites_del,
  create: favorites_create
}