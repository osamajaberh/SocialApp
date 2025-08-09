import { roleTypes } from "../../constants/constants.js";

export const endpoint = {
    createPost : [roleTypes.user],
    freezePost: [roleTypes.user,roleTypes.admin]
}