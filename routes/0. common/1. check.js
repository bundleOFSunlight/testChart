const express = require(`express`);
const router = express.Router();
const rb = require(`@flexsolver/flexrb`);

router.get(``, async function (req, res, next) {
    try {

        res.json(rb.build(result, `Data Retrieved!`));
    } catch (err) {
        next(err);
    }
});

module.exports = router;
