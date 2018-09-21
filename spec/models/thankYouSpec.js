'use strict';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

describe('ThankYou', () => {
  
  const db = require('../../models');
  const ThankYou = db.ThankYou;

  let thankYou, basicThankYou;
  beforeEach(() => {
    basicThankYou = {
      mode: 'In Person',
    };
  
    thankYou = new ThankYou(basicThankYou);
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
      expect(thankYou.createdAt).toBe(undefined);
      expect(thankYou.updatedAt).toBe(undefined);
      thankYou.save().then(obj => {
        expect(thankYou.createdAt instanceof Date).toBe(true);
        expect(thankYou.updatedAt instanceof Date).toBe(true);
        done();
      }).catch(error => {
        done.fail(error);
      });
    });

    it('enumerates mode of Thank You', () => {
      expect(ThankYou.schema.path('mode').enumValues).toEqual(['Email', 'Snail Mail', 'In Person', 'Phone']);
    });

    it('does not allow a non-enumerated mode', done => {
      thankYou.mode = 'Smoke Signals';
      thankYou.save().then(obj => {
        done.fail('Should not save a non-eunumerated mode of expressing thanks');
      }).catch(error => {
        expect(Object.keys(error.errors).length).toEqual(1);
        expect(error.errors['mode'].message).toEqual('Unknown mode of expressing thanks: \'Smoke Signals\'');

        done();
      });
    });

    it('sets the date on which the thanks was expressed if not set explicitly', done => {
      let date = thankYou.date; 
      thankYou.save().then(obj => {
        expect(obj.date instanceof Date).toBe(true);
        expect(obj.date).toEqual(date);
        done();
      }).catch(error => {
        done.fail(error);
      });
    }); 

    it('sets the date at which the event took place', done => {
      let date = new Date(1978, 9, 8);
      thankYou.date = date;
      thankYou.save().then(obj => {
        expect(obj.date instanceof Date).toBe(true);
        expect(obj.date).toEqual(date);
        done();
      }).catch(error => {
        done.fail(error);
      });
    }); 

    it('requires a mode for the Thank You', done => {
      delete basicThankYou.mode;
      ThankYou.create(basicThankYou).then(obj => {
        done.fail('This should not have saved');
      }).catch(error => {
        expect(Object.keys(error.errors).length).toEqual(1);
        expect(error.errors['mode'].message).toEqual('No mode of expressing thanks supplied');
        done();
      });
    });
  });
});
