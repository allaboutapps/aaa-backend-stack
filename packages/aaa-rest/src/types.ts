import * as Joi from "joi";

// common joi types are expoased through REST.types

export const uidv4 = Joi.string().guid().required().description("uidv4 (type)").example("0102cad9-f620-4fd0-bb05-0e1a91784213"); // type has explicitly no label set as it would override the keyname in error messages
export const iso8601Datestring = Joi.date().iso().required().label("iso8601Datestring").description("iso8601Datestring (type)").example("2015-11-29T08:00:00.000Z");

export const email = Joi.string().allow(null).trim().lowercase().max(255).email().label("email").description("email (type): trimed and pattern matched for email, Max 255 long").example("team@allaboutapps.at"); // attention, this might be negative in the future, therefore no range constraints are applied.
export const username = Joi.string().lowercase().regex(/^[0-9a-z_.\-\+@]+$/).trim().options({ convert: false }).example("testuser1"); // important, do not convert!
export const password = Joi.string().trim().min(6).options({ convert: false }).example("testpassword1"); // important, do not convert!
