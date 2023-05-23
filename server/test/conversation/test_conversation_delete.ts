import User from '../../src/db/user';
import Conversation from "../../src/db/conversation";
import ConversationUser from "../../src/db/conversation_user";
import {expect} from "@jest/globals";
import {generate_user, get_token} from "../utils/utils";


let init: RequestInit = { headers: { "Content-Type": "application/json" }},
    url : RequestInfo = "http://localhost:8080/api/conversation/",
    response : Response,
    json : any,
    user : User | null,
    token : string;

let user_list : User[] = [];

const username = "TEST_USER1234$";
const password = "TEST_PASSWORD1234$";

describe('DELETE /api/conversation/{id}', () => {
    beforeEach(async (): Promise<void> => {
        user = await generate_user(username, password, 1);
        token = await get_token(username, password);
        init = { method: "DELETE", headers: { "Content-Type": "application/json", "Authorization" : "Bearer " + token}};
    });

    afterEach(async () : Promise<void> => {
        await ConversationUser.destroy({ where: {} });
        await Conversation.destroy({ where: {} });
        await User.destroy({ where: {} });
    });

    it('200 : conversation deleted', async () => {
        if (user && user.dataValues.id) {
            let conversation: Conversation | null = await Conversation.create({
                name: "TEST_CONVERSATION",
                admin_id: user.dataValues.id,
                creation_date: new Date(),
                edition_date: new Date()
            });

            if (conversation && conversation.dataValues.id) {
                response = await fetch(url + conversation.dataValues.id.toString(), init);
                json = await response.json();

                expect(response.status).toEqual(200);
                expect(json).toEqual({
                    status : 200,
                    success : true
                });

                const conversation_user : ConversationUser | null = await ConversationUser.findOne({ where : { conversation_id : conversation.dataValues.id }});
                expect(conversation_user).toBeNull();

                conversation = await Conversation.findByPk(conversation.dataValues.id);
                expect(conversation).toBeNull();
            } else
                fail("something went wrong : unable to create a conversation in db");
        } else
            fail("something went wrong : unable to create a user in db");
    });

    it('404 : conversation not found', async () : Promise<void> => {
        response = await fetch(url+"-1", init);
        json = await response.json();

        expect(response.status).toEqual(404);
        expect(json).toEqual({
            status : 404,
            error : "Conversation not found"
        });
    });
});
