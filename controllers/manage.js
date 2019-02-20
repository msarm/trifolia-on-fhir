"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const AuthHelper = require("../authHelper");
const _ = require("underscore");
const config = require("config");
const serverConfig = config.get('server');
class ManageController {
    constructor(io, ioConnections) {
        this.io = io;
        this.ioConnections = ioConnections;
    }
    static initRoutes() {
        const router = express.Router();
        router.post('/user/active/message', AuthHelper.checkJwt, (req, res) => {
            if (req.headers['admin-code'] !== serverConfig.adminCode) {
                return res.status(401).send('You have not authenticated request as an admin');
            }
            const controller = new ManageController(req.io, req.ioConnections);
            controller.sendMessageToActiveUsers(req.body.message)
                .then((results) => res.send(results))
                .catch((err) => res.status(500).send(err));
        });
        router.get('/user/active', AuthHelper.checkJwt, (req, res) => {
            if (req.headers['admin-code'] !== serverConfig.adminCode) {
                return res.status(401).send('You have not authenticated request as an admin');
            }
            const controller = new ManageController(req.io, req.ioConnections);
            controller.getActiveUsers()
                .then((results) => res.send(results))
                .catch((err) => res.status(500).send(err));
        });
        return router;
    }
    getActiveUsers() {
        return new Promise((resolve) => {
            const connections = _.map(this.ioConnections, (connection) => {
                let name;
                if (connection.practitioner && connection.practitioner.name && connection.practitioner.name.length > 0) {
                    name = connection.practitioner.name[0].family;
                    if (connection.practitioner.name[0].given && connection.practitioner.name[0].given.length > 0) {
                        if (name) {
                            name += ', ';
                        }
                        name += connection.practitioner.name[0].given.join(' ');
                    }
                }
                return {
                    socketId: connection.id,
                    userId: connection.userProfile ? connection.userProfile.user_id : null,
                    email: connection.userProfile ? connection.userProfile.email : null,
                    practitionerReference: connection.practitioner ? `Practitioner/${connection.practitioner.id}` : null,
                    name: name
                };
            });
            resolve(connections);
        });
    }
    sendMessageToActiveUsers(message) {
        return new Promise((resolve) => {
            this.io.emit('message', message);
            resolve();
        });
    }
}
exports.ManageController = ManageController;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFuYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWFuYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbUNBQW1DO0FBQ25DLDRDQUE0QztBQUU1QyxnQ0FBZ0M7QUFHaEMsaUNBQWlDO0FBRWpDLE1BQU0sWUFBWSxHQUFrQixNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBUXpEO0lBSUksWUFBWSxFQUFVLEVBQUUsYUFBZ0M7UUFDcEQsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFDYixJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztJQUN2QyxDQUFDO0lBRU0sTUFBTSxDQUFDLFVBQVU7UUFDcEIsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBRWhDLE1BQU0sQ0FBQyxJQUFJLENBQUMsc0JBQXNCLEVBQW1CLFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBa0IsR0FBa0IsRUFBRSxHQUFHLEVBQUUsRUFBRTtZQUNuSCxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLEtBQUssWUFBWSxDQUFDLFNBQVMsRUFBRTtnQkFDdEQsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxnREFBZ0QsQ0FBQyxDQUFDO2FBQ2pGO1lBRUQsTUFBTSxVQUFVLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUNuRSxVQUFVLENBQUMsd0JBQXdCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7aUJBQ2hELElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztpQkFDcEMsS0FBSyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFD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QUUsRUFBRTtZQUMzQixJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDakMsT0FBTyxFQUFFLENBQUM7UUFDZCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSjtBQXpFRCw0Q0F5RUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBleHByZXNzIGZyb20gJ2V4cHJlc3MnO1xuaW1wb3J0ICogYXMgQXV0aEhlbHBlciBmcm9tICcuLi9hdXRoSGVscGVyJztcbmltcG9ydCB7Q29ubmVjdGlvbk1vZGVsLCBFeHRlbmRlZFJlcXVlc3QsIElPQ29ubmVjdGlvbiwgU2VydmVyQ29uZmlnfSBmcm9tICcuL21vZGVscyc7XG5pbXBvcnQgKiBhcyBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuaW1wb3J0IHtTZXJ2ZXJ9IGZyb20gJ3NvY2tldC5pbyc7XG5pbXBvcnQge1JlcXVlc3RIYW5kbGVyfSBmcm9tICdleHByZXNzJztcbmltcG9ydCAqIGFzIGNvbmZpZyBmcm9tICdjb25maWcnO1xuXG5jb25zdCBzZXJ2ZXJDb25maWcgPSA8U2VydmVyQ29uZmlnPiBjb25maWcuZ2V0KCdzZXJ2ZXInKTtcblxuaW50ZXJmYWNlIE1hbmFnZVJlcXVlc3QgZXh0ZW5kcyBFeHRlbmRlZFJlcXVlc3Qge1xuICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ2FkbWluLWNvZGUnOiBzdHJpbmdcbiAgICB9O1xufVxuXG5leHBvcnQgY2xhc3MgTWFuYWdlQ29udHJvbGxlciB7XG4gICAgcHJpdmF0ZSBpbzogU2VydmVyO1xuICAgIHJlYWRvbmx5IGlvQ29ubmVjdGlvbnM6IENvbm5lY3Rpb25Nb2RlbFtdO1xuXG4gICAgY29uc3RydWN0b3IoaW86IFNlcnZlciwgaW9Db25uZWN0aW9uczogQ29ubmVjdGlvbk1vZGVsW10pIHtcbiAgICAgICAgdGhpcy5pbyA9IGlvO1xuICAgICAgICB0aGlzLmlvQ29ubmVjdGlvbnMgPSBpb0Nvbm5lY3Rpb25zO1xuICAgIH1cblxuICAgIHB1YmxpYyBzdGF0aWMgaW5pdFJvdXRlcygpIHtcbiAgICAgICAgY29uc3Qgcm91dGVyID0gZXhwcmVzcy5Sb3V0ZXIoKTtcblxuICAgICAgICByb3V0ZXIucG9zdCgnL3VzZXIvYWN0aXZlL21lc3NhZ2UnLCA8UmVxdWVzdEhhbmRsZXI+IEF1dGhIZWxwZXIuY2hlY2tKd3QsIDxSZXF1ZXN0SGFuZGxlcj4gKHJlcTogTWFuYWdlUmVxdWVzdCwgcmVzKSA9PiB7XG4gICAgICAgICAgICBpZiAocmVxLmhlYWRlcnNbJ2FkbWluLWNvZGUnXSAhPT0gc2VydmVyQ29uZmlnLmFkbWluQ29kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuc2VuZCgnWW91IGhhdmUgbm90IGF1dGhlbnRpY2F0ZWQgcmVxdWVzdCBhcyBhbiBhZG1pbicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBjb250cm9sbGVyID0gbmV3IE1hbmFnZUNvbnRyb2xsZXIocmVxLmlvLCByZXEuaW9Db25uZWN0aW9ucyk7XG4gICAgICAgICAgICBjb250cm9sbGVyLnNlbmRNZXNzYWdlVG9BY3RpdmVVc2VycyhyZXEuYm9keS5tZXNzYWdlKVxuICAgICAgICAgICAgICAgIC50aGVuKChyZXN1bHRzKSA9PiByZXMuc2VuZChyZXN1bHRzKSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goKGVycikgPT4gcmVzLnN0YXR1cyg1MDApLnNlbmQoZXJyKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJvdXRlci5nZXQoJy91c2VyL2FjdGl2ZScsIDxSZXF1ZXN0SGFuZGxlcj4gQXV0aEhlbHBlci5jaGVja0p3dCwgPFJlcXVlc3RIYW5kbGVyPiAocmVxOiBNYW5hZ2VSZXF1ZXN0LCByZXMpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXEuaGVhZGVyc1snYWRtaW4tY29kZSddICE9PSBzZXJ2ZXJDb25maWcuYWRtaW5Db2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5zZW5kKCdZb3UgaGF2ZSBub3QgYXV0aGVudGljYXRlZCByZXF1ZXN0IGFzIGFuIGFkbWluJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgTWFuYWdlQ29udHJvbGxlcihyZXEuaW8sIHJlcS5pb0Nvbm5lY3Rpb25zKTtcbiAgICAgICAgICAgIGNvbnRyb2xsZXIuZ2V0QWN0aXZlVXNlcnMoKVxuICAgICAgICAgICAgICAgIC50aGVuKChyZXN1bHRzKSA9PiByZXMuc2VuZChyZXN1bHRzKSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goKGVycikgPT4gcmVzLnN0YXR1cyg1MDApLnNlbmQoZXJyKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiByb3V0ZXI7XG4gICAgfVxuXG4gICAgcHVibGljIGdldEFjdGl2ZVVzZXJzKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY29ubmVjdGlvbnMgPSBfLm1hcCh0aGlzLmlvQ29ubmVjdGlvbnMsIChjb25uZWN0aW9uOiBJT0Nvbm5lY3Rpb24pID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgbmFtZTtcblxuICAgICAgICAgICAgICAgIGlmIChjb25uZWN0aW9uLnByYWN0aXRpb25lciAmJiBjb25uZWN0aW9uLnByYWN0aXRpb25lci5uYW1lICYmIGNvbm5lY3Rpb24ucHJhY3RpdGlvbmVyLm5hbWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBuYW1lID0gY29ubmVjdGlvbi5wcmFjdGl0aW9uZXIubmFtZVswXS5mYW1pbHk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbm5lY3Rpb24ucHJhY3RpdGlvbmVyLm5hbWVbMF0uZ2l2ZW4gJiYgY29ubmVjdGlvbi5wcmFjdGl0aW9uZXIubmFtZVswXS5naXZlbi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUgKz0gJywgJztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSArPSBjb25uZWN0aW9uLnByYWN0aXRpb25lci5uYW1lWzBdLmdpdmVuLmpvaW4oJyAnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHNvY2tldElkOiBjb25uZWN0aW9uLmlkLFxuICAgICAgICAgICAgICAgICAgICB1c2VySWQ6IGNvbm5lY3Rpb24udXNlclByb2ZpbGUgPyBjb25uZWN0aW9uLnVzZXJQcm9maWxlLnVzZXJfaWQgOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICBlbWFpbDogY29ubmVjdGlvbi51c2VyUHJvZmlsZSA/IGNvbm5lY3Rpb24udXNlclByb2ZpbGUuZW1haWwgOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICBwcmFjdGl0aW9uZXJSZWZlcmVuY2U6IGNvbm5lY3Rpb24ucHJhY3RpdGlvbmVyID8gYFByYWN0aXRpb25lci8ke2Nvbm5lY3Rpb24ucHJhY3RpdGlvbmVyLmlkfWAgOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICBuYW1lOiBuYW1lXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXNvbHZlKGNvbm5lY3Rpb25zKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIHNlbmRNZXNzYWdlVG9BY3RpdmVVc2VycyhtZXNzYWdlOiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaW8uZW1pdCgnbWVzc2FnZScsIG1lc3NhZ2UpO1xuICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG59Il19