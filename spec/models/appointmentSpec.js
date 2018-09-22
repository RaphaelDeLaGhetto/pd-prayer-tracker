'use strict';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

describe('Appointment', () => {
  
  const db = require('../../models');
  const Appointment = db.Appointment;

  let appointment, basicAppointment;
  beforeEach(() => {
    basicAppointment = {
      requestMode: 'Email',
      dateOfReply: undefined,
      replyResult: undefined 
    };
  
    appointment = new Appointment(basicAppointment);
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
      expect(appointment.createdAt).toBe(undefined);
      expect(appointment.updatedAt).toBe(undefined);
      appointment.save().then(obj => {
        expect(appointment.createdAt instanceof Date).toBe(true);
        expect(appointment.updatedAt instanceof Date).toBe(true);
        done();
      }).catch(error => {
        done.fail(error);
      });
    });

    it('initializes the object with the correct key/value pairs', () => {
      let appointment = new Appointment(basicAppointment);
      // Believe it or not, the `undefined` values actually work to
      // verify schema membership (see `basicAppointment` def above)
      expect(appointment).toEqual(jasmine.objectContaining(basicAppointment));
    });

    it('enumerates mode of the appointment request', () => {
      expect(Appointment.schema.path('requestMode').enumValues).toEqual(['Email', 'Snail Mail', 'In Person', 'Phone']);
    });

    it('does not allow a non-enumerated mode', done => {
      appointment.requestMode = 'Smoke Signals';
      appointment.save().then(obj => {
        done.fail('Should not save a non-eunumerated mode of requesting an appointment');
      }).catch(error => {
        expect(Object.keys(error.errors).length).toEqual(1);
        expect(error.errors['requestMode'].message).toEqual('Unknown mode of requesting an appointment: \'Smoke Signals\'');

        done();
      });
    });

    it('requires a mode for the initial appointment request', done => {
      delete basicAppointment.requestMode;
      Appointment.create(basicAppointment).then(obj => {
        done.fail('This should not have saved');
      }).catch(error => {
        expect(Object.keys(error.errors).length).toEqual(1);
        expect(error.errors['requestMode'].message).toEqual('No mode of requesting an appointment supplied');
        done();
      });
    });

    it('sets the date on which the appointment was made if not set explicitly', done => {
      let date = appointment.dateOfRequest; 
      appointment.save().then(obj => {
        expect(obj.dateOfRequest instanceof Date).toBe(true);
        expect(obj.dateOfRequest).toEqual(date);
        done();
      }).catch(error => {
        done.fail(error);
      });
    }); 

    it('sets the date at which the appointment was initially requested', done => {
      let date = new Date(1978, 9, 8);
      appointment.dateOfRequest = date;
      appointment.save().then(obj => {
        expect(obj.dateOfRequest instanceof Date).toBe(true);
        expect(obj.dateOfRequest).toEqual(date);
        done();
      }).catch(error => {
        done.fail(error);
      });
    }); 

    it('sets the follow up date to nine days after appointment request if not set explicitly', done => {
      appointment.save().then(obj => {
        expect(obj.followUpOn instanceof Date).toBe(true);

        // 9 days = 60000 milliseconds * 60 minutes * 24 hours * 9 days 
        let days = 60000 * 60 * 24 * 9;
        expect(obj.followUpOn.getDay()).toEqual(new Date(new Date().getTime() + days).getDay());
        done();
      }).catch(error => {
        done.fail(error);
      });
    }); 

    it('sets the follow up date on the initial appointment request', done => {
      let date = new Date(2066, 9, 8);
      appointment.followUpOn = date;
      appointment.save().then(obj => {
        expect(obj.followUpOn instanceof Date).toBe(true);
        expect(obj.followUpOn).toEqual(date);
        done();
      }).catch(error => {
        done.fail(error);
      });
    });

    it('does not allow a follow up date earlier than the initial appointment request', done => {
      let date = new Date(1978, 9, 8);
      appointment.followUpOn = date;
      appointment.save().then(obj => {
        done.fail('This should not have saved');
      }).catch(error => {
        expect(Object.keys(error.errors).length).toEqual(1);
        expect(error.errors['followUpOn'].message).toEqual('You are not a time traveller');
        done();
      });
    });
  }); 


  /**
   * Document relationships
   */
  describe('relationships', () => {
 
    it('includes having many notes', done => {
      appointment.save().then(() => {
        expect(appointment.notes.length).toEqual(0);

        appointment.notes.push({ text: 'Wife got laid off' })
        appointment.save().then(result => {
          expect(appointment.notes.length).toEqual(1);
          expect(result.notes.length).toEqual(1);
          
          appointment.notes.push({ text: 'Check back after Thanksgiving' });
          appointment.save().then(result => {
            expect(appointment.notes.length).toEqual(2);
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
      appointment.save().then(() => {
        expect(appointment.notes.length).toEqual(0);

        appointment.notes.push({ text: 'Wife got laid off' });
        appointment.save().then(result => {
          expect(appointment.notes[0].createdAt).toBeDefined();
          expect(appointment.notes[0].updatedAt).toBeDefined();
 
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

    it('includes having many followUps', done => {
      appointment.save().then(() => {
        expect(appointment.followUps.length).toEqual(0);

        appointment.followUps.push({ mode: 'Email' })
        appointment.save().then(result => {
          expect(appointment.followUps.length).toEqual(1);
          expect(result.followUps.length).toEqual(1);
          
          appointment.followUps.push({ mode: 'Phone' });
          appointment.save().then(result => {
            expect(appointment.followUps.length).toEqual(2);
            expect(result.followUps.length).toEqual(2);
 
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
