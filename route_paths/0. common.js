
module.exports = (app, verifyToken) => {
    app.use(`/common/chart`, require(`../routes/0. common/1. chart`));
};
