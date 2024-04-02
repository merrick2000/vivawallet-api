

const initVivaPayment = async (req, res, next) => {
    const { items } = req.body;
    // Create a PaymentIntent with the order amount and currency
    try{
        const costumer = await stripe.customers.create({
            email: items[0].id,
        })

        const paymentIntent = await stripe.paymentIntents.create({
            amount: calculateOrderAmount(items),
            receipt_email: costumer.email,
            currency: "eur",
            metadata: {
                "reservation_uid": items[0].reservation_uid,
                "event_id": items[0].event_id,
                "container_details": JSON.stringify(items[0].container_details),
                "code_promo": items[0].code_promo,
                "lng": items[0].lng
            },
            customer: costumer.id,
            automatic_payment_methods: {
                enabled: true,
            }
        });
    
        res.send({
            clientSecret: paymentIntent.client_secret,
        });
    } catch(err) {
        console.log(err);
        next(err);
    }
}