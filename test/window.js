(function () {
    var Profile, Post, User, serialized, deserialized;

    function onLoaded(response) {
        Profile = {
            name: 'Profile',
            attributes: {
                first_name: {
                    _type: 'string'
                },
                last_name: {
                    _type: 'string'
                },
                full_name: {
                    _type: 'string',
                    _require: ['first_name', 'last_name'],
                    _get: function () {
                        return this.first_name + ' ' + this.last_name;
                    },
                    _set: function (value) {
                        var names = value.split(' ');

                        this.first_name = names[0];
                        this.last_name = names[1];
                    }
                },
                user: {
                    _type: 'parent',
                    _model: 'User'
                },
                bio: {
                    _type: 'string'
                },
                dob: {
                    _type: 'datetime',
                    _format: 'YYYY-MM-DD'
                }
            }
        };

        Post = {
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

        User = {
            name: 'User',
            attributes: {
                email: {
                    _type: 'email'
                },
                profile: {
                    _type: 'object',
                    _model: Profile
                },
                posts: {
                    _type: 'array-collection',
                    _model: Post
                }
            }
        };

        console.log(serialized = Oatmeal.serialize(response, User));
        console.log(deserialized = Oatmeal.deserialize(serialized, User));
    }

    $.getJSON('data.json', onLoaded);
})();
