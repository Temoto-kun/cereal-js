module.exports = {
    name: 'Post',
    attributes: {
        text: {
            _type: 'string'
        },
        date_published: {
            _type: 'datetime',
            _format: 'YYYY-MM-DD HH:mm:ss'
        },
        author: {
            _type: 'parent',
            _model: 'User'
        }
    }
};
