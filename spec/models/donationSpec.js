'use strict';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

describe('Donation', () => {
  
  const db = require('../../models');
  const Donation = db.Donation;

  let donation, basicDonation;
  beforeEach(() => {
    basicDonation = {
      amount: '300.00',
    };
  
    donation = new Donation(basicDonation);
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
      expect(donation.createdAt).toBe(undefined);
      expect(donation.updatedAt).toBe(undefined);
      donation.save().then(obj => {
        expect(donation.createdAt instanceof Date).toBe(true);
        expect(donation.updatedAt instanceof Date).toBe(true);
        done();
      }).catch(error => {
        done.fail(error);
      });
    });

    it('sets the date on which the donation was made if not set explicitly', done => {
      let date = donation.date; 
      donation.save().then(obj => {
        expect(obj.date instanceof Date).toBe(true);
        expect(obj.date).toEqual(date);
        done();
      }).catch(error => {
        done.fail(error);
      });
    }); 

    it('sets the date at which the event took place', done => {
      let date = new Date(1978, 9, 8);
      donation.date = date;
      donation.save().then(obj => {
        expect(obj.date instanceof Date).toBe(true);
        expect(obj.date).toEqual(date);
        done();
      }).catch(error => {
        done.fail(error);
      });
    }); 

    it('requires an amount for the donation', done => {
      delete basicDonation.amount;
      Donation.create(basicDonation).then(obj => {
        done.fail('This should not have saved');
      }).catch(error => {
        expect(Object.keys(error.errors).length).toEqual(1);
        expect(error.errors['amount'].message).toEqual('No donation amount supplied');
        done();
      });
    });
  });

  describe('currency formatting', () => {
    describe('#formatAmount', () => {
      it('returns the amount property formatted as currency', done => {
        donation.save().then(obj => {
          expect(donation.amount).toEqual(30000);
          expect(donation.formatAmount()).toEqual('300.00');
          done();
        }).catch(error => {
          done.fail(error);
        });     
      });
    });
  });
});
