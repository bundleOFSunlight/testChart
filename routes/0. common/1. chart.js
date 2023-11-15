const express = require(`express`);
const router = express.Router();
const rb = require(`@flexsolver/flexrb`);
const chart_data = require(`../../resources/chart_data.json`)

router.get(``, async function (req, res, next) {
    try {
        const result = chart_data
        res.json(rb.build(result, `Data Retrieved!`));
    } catch (err) {
        next(err);
    }
});



module.exports = router;
