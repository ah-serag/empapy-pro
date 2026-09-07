module.exports = (io, socket) => {
    // 1. انضمام المديرين لغرفة الإدارة العامة
    socket.on('join:manager_room', () => {
        socket.join('manager-room');
        console.log(`Socket ${socket.id} joined manager-room`);
    });

    socket.on('join:team_room', (teamId) => {
        if (teamId) {
            const roomName = `team-room-${teamId}`;
            socket.join(roomName);
            console.log(`Socket ${socket.id} joined ${roomName}`);
        }
    });
};