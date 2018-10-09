'use strict';

describe('Agent', () => {
  const fixtures = require('pow-mongoose-fixtures');
  const db = require('../../models');
  const Agent = db.Agent;

  /**
   * Model must haves
   * `undefined` values actually test for membership. I don't know why this
   * works. Try adding a pair that isn't part of the schema. See test below.
   */
  let required;

  let agent;
  beforeEach(done => {
    required = {
      email: 'someguy@example.com',
      password: 'secret',
      name: undefined,
    };
 
    agent = new Agent(required);

    done();
  });

  afterEach(done => {
    db.mongoose.connection.db.dropDatabase().then((err, result) => {
      done();
    }).catch(err => {
      done.fail(err);         
    });
  });
 
  describe('basic validation', () => {

    it('sets the createdAt and updatedAt fields', done => {
      expect(agent.createdAt).toBe(undefined);
      expect(agent.updatedAt).toBe(undefined);
      agent.save().then((obj) => {
        expect(agent.createdAt instanceof Date).toBe(true);
        expect(agent.updatedAt instanceof Date).toBe(true);
        done();
      }).catch(error => {
        done.fail(error);
      });
    });

    it('initializes the object with the correct key/value pairs', () => {
      let agent = new Agent(required);
      // Believe it or not, the `undefined` values actually work to
      // verify schema membership (see `required` def above)
      expect(agent).toEqual(jasmine.objectContaining(required));
    });

    it("encrypts the agent's password", done => {
      expect(agent.password).toEqual('secret');
      agent.save().then((obj) => {
        Agent.findById(obj._id).then(results => {
          expect(results.password).not.toEqual('secret');
          done();
        }).catch(error => {
          done.fail(error);
        });
      }).catch(error => {
        done.fail(error);
      });
    });

    it('does not allow two identical emails', done => {
      agent.save().then((obj) => {
        Agent.create({ email: 'someguy@example.com', password: 'secret' }).then((obj) => {
          done.fail('This should not have saved');
        }).catch(error => {
          expect(Object.keys(error.errors).length).toEqual(1);
          expect(error.errors['email'].message).toEqual('That email is taken');
          done();
        });
      }).catch(error => {
        done.fail(error);
      });
    });

    it('does not allow an empty email field', done => {
      required.email = '   ';
      Agent.create(required).then((obj) => {
        done.fail('This should not have saved');
      }).catch(error => {
        expect(Object.keys(error.errors).length).toEqual(1);
        expect(error.errors['email'].message).toEqual('No email supplied');
        done();
      });
    });

    it('does not allow an undefined email field', done => {
      delete required.email;
      Agent.create(required).then((obj) => {
        done.fail('This should not have saved');
      }).catch(error => {
        expect(Object.keys(error.errors).length).toEqual(1);
        expect(error.errors['email'].message).toEqual('No email supplied');
        done();
      });
    });

    it('does not allow an empty password field', done => {
      required.password = '    ';
      Agent.create(required).then((obj) => {
        done.fail('This should not have saved');
      }).catch(error => {
        expect(Object.keys(error.errors).length).toEqual(1);
        expect(error.errors['password'].message).toEqual('No password supplied');
        done();
      });
    });

    it('does not allow an undefined password field', done => {
      delete required.password;
      Agent.create(required).then((obj) => {
        done.fail('This should not have saved');
      }).catch(error => {
        expect(Object.keys(error.errors).length).toEqual(1);
        expect(error.errors['password'].message).toEqual('No password supplied');
        done();
      });
    });

    it('does not re-hash a password on update', done => {
      agent.save().then((obj) => {
        let passwordHash = agent.password;
        agent.email = 'newemail@example.com';
        agent.save().then((obj) => {
          expect(agent.password).toEqual(passwordHash); 
          done();
        });
      });
    });

    /**
     * .validPassword
     */
    describe('.validPassword', () => {
      beforeEach(done => {
        agent.save().then((obj) => {
          done();
        });
      });

      it('returns true if the password is a match', done => {
        Agent.validPassword('secret', agent.password, (err, res) => {
          expect(res).toEqual(agent);
          done();
        }, agent);
      });

      it('returns false if the password is not a match', done => {
        Agent.validPassword('wrongsecretpassword', agent.password, (err, res) => {
          expect(res).toBe(false);
          done();
        }, agent);
      });
    });
  });

  /**
   * Document relationships
   */
  describe('relationships', () => {
    it('includes having many partners', done => {
      agent.save().then(results => {
        db.Partner.create({ email: 'generous@donor.com', name: 'Benny S' }).then((p1) => {
          expect(agent.partners.length).toEqual(0);
          agent.partners.push(p1);
          agent.update().then(() => {
            expect(agent.partners.length).toEqual(1);
            agent.populate('partners', (err, acct) => {
              if (err) done.fail(err);
              expect(agent.partners[0].email).toEqual(p1.email);

              // Add another partner
              db.Partner.create({ email: 'another@donor.com', name: 'Garth W' }).then((p2) => {
                expect(agent.partners.length).toEqual(1);
                agent.partners.push(p2);
                agent.update().then(() => {
                  expect(agent.partners.length).toEqual(2);
                  agent.populate('partners', (err, acct) => {
                    if (err) done.fail(err);
                      expect(agent.partners[0].email).toEqual(p1.email);
                      expect(agent.partners[1].email).toEqual(p2.email);
                      done();
                    });
                }).catch(error => {
                  done.fail(error);
                });
              }).catch(error => {
                done.fail(error);
              });
            });
          }).catch(error => {
            done.fail(error);
          });
        }).catch(error => {
          done.fail(error);
        });
      }).catch(error => {
        done.fail(error);
      });
    });

    it('does not allow two partners with the same email', done => {
      agent.partners.push({ email: 'horst@example.com', name: 'Horst A' });
      agent.save().then(results => {

        agent.partners.push({ email: 'horst@example.com', name: 'Horst B'});
        agent.save().then(result => {
          done.fail('This should not allow two partners with the same email');
        }).catch(error => {
          expect(error.errors['partners'].message).toEqual('You already have a partner with email: horst@example.com');
          done();
        });
      }).catch(error => {
        done.fail(error);
      });
    });

    it('does not save two partners with the same email in the agent\'s partner list', done => {
      db.Agent.findById(agent._id).then(results => {
        expect(results).toBeNull();

        agent.partners.push({ email: 'horst@example.com', name: 'Horst A'});
        agent.save().then(results => {
  
          db.Agent.findById(agent._id).then(results => {
            expect(results.partners.length).toEqual(1);

            // Add double
            agent.partners.push({ email: 'horst@example.com', name: 'Horst B' });
            agent.save().then(result => {
              done.fail('This should not allow two partners with the same email');
            }).catch(error => {
              db.Agent.findById(agent._id).then(results => {
                expect(results.partners.length).toEqual(1);
                done();
              }).catch(error => {
                done.fail(error);
              });
            });
          }).catch(error => {
            done.fail(error);
          });
        }).catch(error => {
          done.fail(error);
        });
      }).catch(error => {
        done.fail(error);
      });
    });

    /**
     * This test is included simply to remind myself of how Mongo treats
     * subdocuments
     */
    it('does not save a separate partners document', done => {
      db.Partner.find().then(results => {
        expect(results.length).toEqual(0);

        agent.partners.push({ email: 'horst@example.com', name: 'Horst A' });
        agent.save().then(results => {
  
          db.Partner.find().then(results => {
            expect(results.length).toEqual(0);

            // Add double
            agent.partners.push({ email: 'horst@example.com', name: 'Horst B'});
            agent.save().then(result => {
              done.fail('This should not allow two partners with the same email');
            }).catch(error => {
              db.Partner.find().then(results => {
                expect(results.length).toEqual(0);
                done();
              }).catch(error => {
                done.fail(error);
              });
            });
          }).catch(error => {
            done.fail(error);
          });
        }).catch(error => {
          done.fail(error);
        });
      }).catch(error => {
        done.fail(error);
      });
    });
  });
});
