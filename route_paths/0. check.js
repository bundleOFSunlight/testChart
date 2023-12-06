
module.exports = (app, verifyToken) => {
    app.use(`/check`, require(`../routes/0. common/1. check`));
};
