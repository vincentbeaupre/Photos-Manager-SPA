
import * as utilities from './utilities.js';
import Repository from './models/repository.js';
import Token from './models/token.js';
import * as ServerVariables from "./serverVariables.js";
import { log } from "./log.js";

global.tokensRepository = new Repository(new Token());

global.tokenLifeDuration = ServerVariables.get("main.token.lifeDuration");

export default
    class TokensManager {
    static create(user) {
        let token = TokensManager.findUser(user.Id);
        if (!token) {
            token = Token.create(user);
            token.Expire_Time = utilities.nowInSeconds() + tokenLifeDuration;
            tokensRepository.add(token);
            console.log("User " + token.User.Name + " logged in");
        } else {
            console.log("User " + token.User.Name + " already logged in");
        }
        return token;
    }
    static findUser(userId) {
        let tokens = tokensRepository.getAll();
        for (let token of tokens) {
            if (token.User.Id == userId) {
                // renew expiration date
                token.Expire_Time = utilities.nowInSeconds() + tokenLifeDuration;
                tokensRepository.update(token.Id, token);
                return token;
            }
        }
        return null;
    }
    static logout(userId) {
        let tokens = tokensRepository.getAll();
        let index = 0;
        let indexToDelete = [];
        for (let token of tokens) {
            if (token.User.Id == userId) {
                indexToDelete.push(index);
                console.log("User " + token.User.Name + " logged out");
            }
            index++;
        }
        tokensRepository.removeByIndex(indexToDelete);
    }
    static clean() {
        let tokens = tokensRepository.getAll();
        let now = utilities.nowInSeconds();
        let index = 0;
        let indexToDelete = [];
        for (let token of tokens) {
            if (token.Expire_Time < now) {
                indexToDelete.push(index);
                console.log("Access token of user " + token.User.Name + " expired");
            }
            index++;
        }
        if (index > 0)
            tokensRepository.removeByIndex(indexToDelete);
    }
    static find(access_token, renew = true) {
        let token = tokensRepository.findByField('Access_token', access_token);
        if (token != null) {
            if (renew) {
                // renew expiration date
                token.Expire_Time = utilities.nowInSeconds() + tokenLifeDuration;
                tokensRepository.update(token.Id, token);
            }
            return token;
        }
        return null;
    }

    static getToken(req) {
        if (req.headers["authorization"] != undefined) {
            // Extract bearer token from head of the http request
            let token = req.headers["authorization"].replace('Bearer ', '');
            return this.find(token);
        }
        return null;
    }

}

// periodic cleaning of expired tokens
log(BgWhite, FgBlack, "Periodic tokens repository cleaning process started...");
setInterval(TokensManager.clean, tokenLifeDuration * 1000);
