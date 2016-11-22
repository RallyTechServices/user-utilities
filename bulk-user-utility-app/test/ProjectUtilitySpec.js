describe('CA.technicalservices.userutilities.ProjectUtility', function() {

    it ('should figure out excluded projects', function(){
        var children = [{
            ObjectID: 1,
            Name: "Project 1",
            Parent: null,
            __projectHierarchy: [1],
            children: [{
                ObjectID: 2,
                Name: 'Project 1.1',
                Parent: 1,
                __projectHierarchy: [1, 2],
                children: [{
                    ObjectID: 4,
                    Name: 'Project 1.1.1',
                    Parent: 2,
                    __projectHierarchy: [1, 2, 4],
                    children: []
                }]
            }, {

                    ObjectID: 3,
                    Name: 'Project 1.2',
                    Parent: 1,
                    __projectHierarchy: [1, 3],
                    children: [{
                        ObjectID: 5,
                        Name: 'Project 1.2.1',
                        Parent: 3,
                        __projectHierarchy: [1, 3, 5],
                        children: []
                    },{
                        ObjectID: 6,
                        Name: 'Project 1.2.2',
                        Parent: 3,
                        __projectHierarchy: [1, 3, 6],
                        children: []
                    }]
            }]
        }];

        var excludedProjects = CA.technicalservices.userutilities.ProjectUtility.getExcludedProjects(
                children,
                [1,2,3,5,6]
        );

        expect(excludedProjects.length).toBe(1);
        expect(excludedProjects[0]).toBe(4);
    });


    it ('should get the root project data', function(){
        var hash = {
            1: {
                ObjectID: 1,
                Name: "Project 1",
                Parent: null,
                __projectHierarchy: [1],
                children: [{
                    ObjectID: 2,
                    Name: 'Project 1.1',
                    Parent: {ObjectID: 1},
                    __projectHierarchy: [1, 2],
                    children: [{
                        ObjectID: 4,
                        Name: 'Project 1.1.1',
                        Parent: {ObjectID: 2},
                        __projectHierarchy: [1, 2, 4],
                        children: []
                    }]
                }, {
                    ObjectID: 3,
                    Name: 'Project 1.2',
                    Parent: {ObjectID: 1},
                    __projectHierarchy: [1, 3],
                    children: [{
                        ObjectID: 5,
                        Name: 'Project 1.2.1',
                        Parent: {ObjectID: 3},
                        __projectHierarchy: [1, 3, 5],
                        children: []
                    },{
                        ObjectID: 6,
                        Name: 'Project 1.2.2',
                        Parent: {ObjectID: 3},
                        __projectHierarchy: [1, 3, 6],
                        children: []
                    }]
                }]
            },
            2: {
                ObjectID: 2,
                Name: 'Project 1.1',
                Parent: {ObjectID: 1},
                __projectHierarchy: [1, 2],
                children: [{
                    ObjectID: 4,
                    Name: 'Project 1.1.1',
                    Parent: {ObjectID: 2},
                    __projectHierarchy: [1, 2, 4],
                    children: []
                }]
            },
            4: {
                ObjectID: 4,
                Name: 'Project 1.1.1',
                Parent: {ObjectID: 2},
                __projectHierarchy: [1, 2, 4],
                children: []
            },
            3: {
                ObjectID: 3,
                Name: 'Project 1.2',
                Parent: {ObjectID: 1},
                __projectHierarchy: [1, 3],
                children: [{
                    ObjectID: 5,
                    Name: 'Project 1.2.1',
                    Parent: {ObjectID: 3},
                    __projectHierarchy: [1, 3, 5],
                    children: []
                },{
                    ObjectID: 6,
                    Name: 'Project 1.2.2',
                    Parent: {ObjectID: 3},
                    __projectHierarchy: [1, 3, 6],
                    children: []
                }]
            },
            5: {
                ObjectID: 5,
                Name: 'Project 1.2.1',
                Parent: {ObjectID: 3},
                __projectHierarchy: [1, 3, 5],
                children: []
            },
            6: {
                ObjectID: 6,
                Name: 'Project 1.2.2',
                Parent: {ObjectID: 3},
                __projectHierarchy: [1, 3, 6],
                children: []
            }
        };

        var rootData = CA.technicalservices.userutilities.ProjectUtility.getRootProjectData(
            [1,2,3,5,6],
            hash
        );

        expect(rootData.length).toBe(1);
        expect(rootData[0].rootProjectOID).toBe(1);
        expect(rootData[0].excludedProjectOIDs.length).toBe(1);
        expect(rootData[0].excludedProjectOIDs[0]).toBe(4);

    });

});
