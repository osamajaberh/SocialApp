export const successResponse = ({ res, status = 200, message = "Done", data = {}, pagination }) => {
    const response = { message, data };

    if (pagination) {
        response.pagination = pagination;
    }

    return res.status(status).json(response);
};
