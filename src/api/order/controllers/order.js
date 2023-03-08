'use strict';
const stripe = require('stripe')("sk_test_51MiDHHLvo3juCzlZDQy2c7rhpXXVIwW2L6QxKAT1rBmGK9arAmFt2FJ4bcU8AoJSqZpFmaOKnARpz1fX2esPO6BB001B8DfbbJ")

/**
 * order controller
 */

const calcDiscountPrice = (price, discount) => {
    if(!discount) return price;

    const discountAmount = (price*discount)/100
    const result = price - discount
    return result.toFixed(2);
}

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::order.order', ({strapi})=>({
    async paymentOrder(ctx) {
        // ctx.body = "Pago y pedido generado correctamente"
        const { token, products, idUser, addressShipping } =  ctx.request.body;
        let totalPayment = 0

        productos.forEach(product => {
            const priceTemp = calcDiscountPrice(product.attributes.price, product.attributes.discount)
            totalPayment += Number(priceTemp) * product.quantity;
        });
        //ejecutar pago en stripe
        const charge = await stripe.charges.create({
            amount: Math.round( totalPayment * 100 ),
            currency:  "eur",
            source: token.id,
            description: `User ID: ${idUser}`
        })
        //creamos la data
        const data = {
            products,
            user: idUser,
            totalPayment,
            idPayment: charge.id,
            addressShipping,
        }
        //validacion strapi
        const model = strapi.contentTypes["api::order.order"];
        const validData = await strapi.entityValidator.validateEntityCreation(model, data)

        //guardamos en base de datos
        const entry = await strapi.db
            .query("api::order.order")
            .create({data: validData})
        //devolvemos la info al cliente
        return entry
    },

}));
