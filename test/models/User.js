module.exports = {
    name: 'User',
    attributes: {
        email: {
            _type: 'email'
        },
        profile: {
            _type: 'object',
            _model: require('./Profile')
        },
        posts: {
            _type: 'array-collection',
            _model: require('./Post')
        }
    }
};
