'use strict';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

describe('FollowUp', () => {
  
  const db = require('../../models');
  const FollowUp = db.FollowUp;

  let followUp, basicFollowUp;
  beforeEach(() => {
    basicFollowUp = {
      mode: 'Email',
      dateOfReply: undefined,
      replyResult: undefined 
    };
  
    followUp = new FollowUp(basicFollowUp);
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
      expect(followUp.createdAt).toBe(undefined);
      expect(followUp.updatedAt).toBe(undefined);
      followUp.save().then(obj => {
        expect(followUp.createdAt instanceof Date).toBe(true);
        expect(followUp.updatedAt instanceof Date).toBe(true);
        done();
      }).catch(error => {
        done.fail(error);
      });
    });

    it('initializes the object with the correct key/value pairs', () => {
      let followUp = new FollowUp(basicFollowUp);
      // Believe it or not, the `undefined` values actually work to
      // verify schema membership (see `basicFollowUp` def above)
      expect(followUp).toEqual(jasmine.objectContaining(basicFollowUp));
    });

    it('enumerates mode of the followUp request', () => {
      expect(FollowUp.schema.path('mode').enumValues).toEqual(['Email', 'Snail Mail', 'In Person', 'Phone']);
    });

    it('does not allow a non-enumerated mode', done => {
      followUp.mode = 'Smoke Signals';
      followUp.save().then(obj => {
        done.fail('Should not save a non-eunumerated mode of requesting an followUp');
      }).catch(error => {
        expect(Object.keys(error.errors).length).toEqual(1);
        expect(error.errors['mode'].message).toEqual('Unknown mode of requesting an followUp: \'Smoke Signals\'');

        done();
      });
    });

    it('requires a mode for the initial followUp request', done => {
      delete basicFollowUp.mode;
      FollowUp.create(basicFollowUp).then(obj => {
        done.fail('This should not have saved');
      }).catch(error => {
        expect(Object.keys(error.errors).length).toEqual(1);
        expect(error.errors['mode'].message).toEqual('No mode of requesting an followUp supplied');
        done();
      });
    });

    it('sets the date on which the followUp was made if not set explicitly', done => {
      let date = followUp.date; 
      followUp.save().then(obj => {
        expect(obj.date instanceof Date).toBe(true);
        expect(obj.date).toEqual(date);
        done();
      }).catch(error => {
        done.fail(error);
      });
    }); 

    it('sets the date at which the followUp was initially requested', done => {
      let date = new Date(1978, 9, 8);
      followUp.date = date;
      followUp.save().then(obj => {
        expect(obj.date instanceof Date).toBe(true);
        expect(obj.date).toEqual(date);
        done();
      }).catch(error => {
        done.fail(error);
      });
    }); 
  }); 

  /**
   * Document relationships
   */
  describe('relationships', () => {
 
    it('includes having many notes', done => {
      followUp.save().then(() => {
        expect(followUp.notes.length).toEqual(0);

        followUp.notes.push({ text: 'Wife got laid off' })
        followUp.save().then(result => {
          expect(followUp.notes.length).toEqual(1);
          expect(result.notes.length).toEqual(1);
          
          followUp.notes.push({ text: 'Check back after Thanksgiving' });
          followUp.save().then(result => {
            expect(followUp.notes.length).toEqual(2);
            expect(result.notes.length).toEqual(2);
 
            done();
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

    it('timestamps notes', done => {
      followUp.save().then(() => {
        expect(followUp.notes.length).toEqual(0);

        followUp.notes.push({ text: 'Wife got laid off' });
        followUp.save().then(result => {
          expect(followUp.notes[0].createdAt).toBeDefined();
          expect(followUp.notes[0].updatedAt).toBeDefined();
 
          expect(result.notes[0].createdAt).toBeDefined();
          expect(result.notes[0].updatedAt).toBeDefined();
          
          done();
        }).catch(error => {
          done.fail(error);
        });
      }).catch(error => {
        done.fail(error);
      });
    });
  });
});
