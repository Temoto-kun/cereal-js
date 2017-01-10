(function () {
    var Profile, Post, User, Tag, serialized, deserialized;

    function onLoaded(data) {
        Tag = {
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
                },
                tags: {
                    _type: 'array-collection',
                    _model: Tag
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

        console.log("DATA");
        console.log(data);
        console.log("SERIALIZED");
        console.log(serialized = Oatmeal.serialize(data, User));
        console.log("DESERIALIZED");
        console.log(deserialized = Oatmeal.deserialize(serialized, User));
    }

    $.getJSON('data.json', onLoaded);
})();
