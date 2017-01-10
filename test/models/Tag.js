module.exports = {
    name: 'Tag',
    attributes: {
        label: {
            _type: 'string'
        },
        created_by: {
            _type: 'object',
            _model: 'User'
        }
    }
};
