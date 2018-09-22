'use strict';

describe('Partner', function() {
  const db = require('../../models');
  const Partner = db.Partner;

  /**
   * Model must haves
   * `undefined` values actually test for membership. I don't know why this
   * works. Try adding a pair that isn't part of the schema. See test below.
   */
  let required;

  let partner;
  beforeEach(done => {
    required = {
      email: 'someguy@example.com',
      name: undefined 
    };
 
    partner = new Partner(required);

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

    it('sets the createdAt and updatedAt fields', (done) => {
      expect(partner.createdAt).toBe(undefined);
      expect(partner.updatedAt).toBe(undefined);
      partner.save().then((obj) => {
        expect(partner.createdAt instanceof Date).toBe(true);
        expect(partner.updatedAt instanceof Date).toBe(true);
        done();
      }).catch((error) => {
        done.fail(error);
      });
    });

    it('initializes the object with the correct key/value pairs', () => {
      let partner = new Partner(required);
      // Believe it or not, the `undefined` values actually work to
      // verify schema membership (see `required` def above)
      expect(partner).toEqual(jasmine.objectContaining(required));
    });

    it('does not allow an empty email field', (done) => {
      required.email = '   ';
      Partner.create(required).then((obj) => {
        done.fail('This should not have saved');
      }).catch((error) => {
        expect(Object.keys(error.errors).length).toEqual(1);
        expect(error.errors['email'].message).toEqual('No email supplied');
        done();
      });
    });

    it('does not allow an undefined email field', (done) => {
      delete required.email;
      Partner.create(required).then((obj) => {
        done.fail('This should not have saved');
      }).catch((error) => {
        expect(Object.keys(error.errors).length).toEqual(1);
        expect(error.errors['email'].message).toEqual('No email supplied');
        done();
      });
    });
  });

  /**
   * Document relationships
   */
  describe('relationships', () => {
    it('includes having many donations', done => {
      partner.save().then(result => {
        expect(partner.donations.length).toEqual(0);

        partner.donations.push({ amount: '$299' })
        partner.save().then(result => {
          expect(partner.donations.length).toEqual(1);
          expect(result.donations.length).toEqual(1);
          
          partner.donations.push({ amount: '$350' })
          partner.save().then(result => {
            expect(partner.donations.length).toEqual(2);
            expect(result.donations.length).toEqual(2);
 
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

    it('includes having many notes', done => {
      partner.save().then(() => {
        expect(partner.notes.length).toEqual(0);

        partner.notes.push({ text: 'Wife, Dawna' })
        partner.save().then(result => {
          expect(partner.notes.length).toEqual(1);
          expect(result.notes.length).toEqual(1);
          
          partner.notes.push({ text: 'One son. Find out name' });
          partner.save().then(result => {
            expect(partner.notes.length).toEqual(2);
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
      partner.save().then(() => {
        expect(partner.notes.length).toEqual(0);

        partner.notes.push({ text: 'Wife, Dawna' });
        partner.save().then(result => {
          expect(partner.notes[0].createdAt).toBeDefined();
          expect(partner.notes[0].updatedAt).toBeDefined();
 
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

    it('includes having many prayers', done => {
      partner.save().then(() => {
        expect(partner.prayers.length).toEqual(0);

        partner.prayers.push({ text: 'Please give Carol strength to deal with her sister\'s abuse' })
        partner.save().then(result => {
          expect(partner.prayers.length).toEqual(1);
          expect(result.prayers.length).toEqual(1);
          
          partner.prayers.push({ text: 'Please cast out the lying spirits that cause strife' })
          partner.save().then(result => {
            expect(partner.prayers.length).toEqual(2);
            expect(result.prayers.length).toEqual(2);
 
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

    it('timestamps prayers', done => {
      partner.save().then(() => {
        expect(partner.prayers.length).toEqual(0);

        partner.prayers.push({ text: 'Please give Carol strength to deal with her sister\'s abuse' })
        partner.save().then(result => {
          expect(partner.prayers[0].createdAt).toBeDefined();
          expect(partner.prayers[0].updatedAt).toBeDefined();
 
          expect(result.prayers[0].createdAt).toBeDefined();
          expect(result.prayers[0].updatedAt).toBeDefined();
          
          done();
        }).catch(error => {
          done.fail(error);
        });
      }).catch(error => {
        done.fail(error);
      });
    });

    it('includes having many thankYous', done => {
      partner.save().then(() => {
        expect(partner.thankYous.length).toEqual(0);

        partner.thankYous.push({ mode: 'Snail Mail' })
        partner.save().then(result => {
          expect(partner.thankYous.length).toEqual(1);
          expect(result.thankYous.length).toEqual(1);
          
          partner.thankYous.push({ mode: 'Snail Mail' })
          partner.save().then(result => {
            expect(partner.thankYous.length).toEqual(2);
            expect(result.thankYous.length).toEqual(2);
 
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
  });
});
