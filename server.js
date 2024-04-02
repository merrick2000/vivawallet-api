import app from "./app.js";
import ngrok from 'ngrok';
// import push from './src/job/push_notification.js';

app.listen(process.env.PORT || 3000, () => {
    console.log(`App running at http://localhost:${process.env.PORT || 3000}`);
    ngrok.connect(process.env.PORT || 3000).then(ngrokUrl=> {
        console.log('ngrok url: ', ngrokUrl)
    }).catch(error => {
        console.log('ngerror: ', error)
    })

    // run a cron every 1 hour
    // cron.schedule('0 * * * *', async () => {
    //     console.log('running a task every hour');
    //     await push.remindeNotifications();
    //     await push.feedbackNotifications();
    // });
  
});