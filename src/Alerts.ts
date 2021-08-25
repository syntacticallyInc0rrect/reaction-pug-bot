import {BotActionOptions, timeToAlert} from "./Api";
import {Queue, queuedPlayers} from "./Queue";

export const Alerts = () => {
    queuedPlayers && queuedPlayers.forEach(qp => {
        if (qp.warned) {
            queuedPlayers.splice(queuedPlayers.indexOf(qp), 1);
            Queue(BotActionOptions.update, undefined, undefined, qp.user);
        } else if ((new Date().getTime() - timeToAlert.getTime()) > qp.timestamp.getTime()) {
            qp.user.send(/*TODO: replace with queuealertembed method and constructor*/ "message").then(
                () => console.log(`${qp.user} was alerted they may be removed from queue at ${new Date()}`)
            );
            qp.warned = true;
        }
    })
}