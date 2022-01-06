const errorHandler = function(status, error, res) {
    let respond_text
    switch(status) {
        case 500:
            respond_text = "There's a internal server error !"
            break;
        case 401:
            respond_text = "Make sure you are logged in first !"
            break;
        case 404:
            respond_text = "Your requested file or files not found !"
            break;
    }
    let response_err = {
        message: respond_text,
        detail: error
    }
    return res.status(status).json(response_err)
}

module.exports = errorHandler;