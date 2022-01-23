const { uid } = require("uid");

/**
 * Class room
 */
class Room {

    /**
     * Constructor
     * @param {*} creator 
     * @param {*} name 
     * @param {*} password 
     * @param {*} maxSize 
     * @param {*} currentSize 
     */
    constructor(creator, name, password = "", maxSize = 10) {
        this.roomID = "";

        this.creator = creator;
        this.name = name;
        this.password = password;
        this.maxSize = maxSize;
        this.currentSize = 1;
        this.lstPlayers = [creator];
        // console.log(uid);
        this.roomID = uid();
        this.webSocketClients = [];
    }

    changeCreator(newCreator) {
        this.creator = newCreator;
    }

    /**
     * Let a person join a room
     * @param {*} person 
     * @param {*} password 
     * @returns 
     */
    joinRoom(person, password) {
        if (password === this.password && parseInt(this.currentSize) + 1 <= parseInt(this.maxSize)) {
            this.currentSize++;
            this.lstPlayers.push(person);
            return true;
        } else {
            return false;
        }
    }

    clientWebSocketJoin(client) {
        this.webSocketClients.push(client);
    }

    sendData(data = "toto") {
        for (const client of this.webSocketClients) {
            client.send(JSON.stringify(data));
        }
    }

    getRoom() {
        return {
            roomID: this.roomID,
            name: this.name,
            creator: this.creator,
            currentSize: this.currentSize,
            maxSize: this.maxSize,
            lstPlayers: this.lstPlayers,
            webSocketClientsNb: this.webSocketClients.length
        };
    }
}

module.exports = Room;