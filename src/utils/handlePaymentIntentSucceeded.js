import pool from '../../db.js';
import { 
  generateAndShortenQRCode, 
  generateConnectedMessage, 
  generateDisconnectedMessage 
} from './generate_shorter.js'
import sendSms from './sms_sender.js';
import send_mail from './send_mail.js';

const handlePaymentIntentSucceeded = async (reservation) => {
  try {
    const reservationData = await pool.query(`
          UPDATE reservations 
          SET status = 'payed', pi = $2 , lng = $3 WHERE uid = $1
          RETURNING *;`, [reservation.reservation_uid, reservation.pi, reservation.lng]
      );

      // make unique query for select
      const data = await pool.query(
        `SELECT event FROM events WHERE id = $1;`, [reservation.event_id]
      );

      if(reservation.code_promo) {

        await pool.query(`UPDATE promo SET used = true WHERE code = $1 RETURNING *`, [reservation.code_promo]);
      
      }


      if(reservationData.rows[0]){
        const { 
          uid, 
          client_name, 
          client_last_name, 
          client_phone, 
          container_serial_nb, 
          mot_de_pass, 
          place, client_email,
          friend1_phone,
          friend2_phone,
          lng
        } = reservationData.rows[0];

        
        const { event } = data.rows[0];

        const { name, connected} = JSON.parse(reservation.container_details);
    
        let message = "";
        const cancelLink = `${process.env.ROOT_URL}/r/${uid}`;


        // mail data
        const template_options = {
          name: client_name,
          reservation_uid: uid,
          code: mot_de_pass,
          event: event,
          cancel_link: cancelLink,
          subject: (lng === 'fr') || (lng === 'FR') ? "Nouvelle réservation" : "New reservation"
         };
    
        if(connected){

            // generate qrcode
            const qrcodeLinks = await generateAndShortenQRCode(container_serial_nb, mot_de_pass, uid);

            //generate message
            message = await generateConnectedMessage(client_name, 
              client_last_name, uid, event, 
              mot_de_pass, place, cancelLink, 
              qrcodeLinks.qrcodeLink, name, lng);

            //send mail
            template_options["qr_code_link"] = qrcodeLinks.qrcodeApi;
            template_options["qr_code_short_link"] = qrcodeLinks.qrcodeLink;

            
            send_mail(
              (lng === 'fr') || (lng === 'FR') ? "reservation_confirmation_connected" : "reservation_confirmation_connected_en", 
              (lng === 'fr') || (lng === 'FR') ? "Nouvelle réservation" : "New reservation", 
              client_email.trim(), 
              template_options
            );  

        } else {

            //generate message
            message = await generateDisconnectedMessage(client_last_name, 
              client_name, uid, event, 
              mot_de_pass, place, cancelLink, name, lng);

            //send mail
              send_mail(
                (lng === 'fr') || (lng === 'FR') ? "reservation_confirmation_no_connected" : "reservation_confirmation_no_connected_en", 
                (lng === 'fr') || (lng === 'FR') ? "Nouvelle réservation" : "New reservation", 
                client_email.trim(), 
                template_options
              );

        }

        // send sms
        sendSms(client_phone, message);

        if(friend1_phone.trim() !== '') sendSms(friend1_phone, message);

        if(friend2_phone.trim() !== '') sendSms(friend2_phone, message);

      } else {
        return "No reservation found";
      }
    } catch(err) {
      console.log(err);
    }


}


export default handlePaymentIntentSucceeded;