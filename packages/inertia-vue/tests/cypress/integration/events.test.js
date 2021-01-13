import { tap } from '../support/commands'

const assertVisitObject = visit => {
  expect(visit).to.be.an('object')
  expect(visit).to.have.property('url')
  expect(visit).to.have.property('method')
  expect(visit).to.have.property('data')
  expect(visit).to.have.property('headers')
  expect(visit).to.have.property('onBefore')
  expect(visit).to.have.property('onProgress')
  expect(visit).to.have.property('preserveState')
}
const assertPageObject = page => {
  expect(page).to.be.an('object')
  expect(page).to.have.property('component')
  expect(page).to.have.property('props')
  expect(page).to.have.property('url')
  expect(page).to.have.property('version')
}
const assertProgressObject = progress => {
  expect(progress).to.have.property('isTrusted')
  expect(progress).to.have.property('percentage')
  expect(progress).to.have.property('total')
  expect(progress).to.have.property('loaded')
  expect(progress.percentage).to.be.gte(0).and.lte(100)
}

describe('Events', () => {
  let alert = null
  beforeEach(() => {
    cy.visit('/events', {
      onLoad: () => cy.on('window:load', () => {
        throw 'A location/non-SPA visit was detected'
      }),
    })

    alert = cy.stub()
    cy.on('window:alert', alert)
  })

  describe('Listeners', () => {
    it('does not have any listeners by default', () => {
      cy.get('.without-listeners')
        .click()
        .wait(30)
        .then(() => {
          expect(alert.getCalls()).to.have.length(0)
        })
    })

    describe('Inertia.on', () => {
      it('returns a callback that can be used to remove the global listener', () => {
        cy.get('.remove-inertia-listener')
          .click()
          .wait(30)
          .then(() => {
            expect(alert.getCalls()).to.have.length(3)
            expect(alert.getCall(0)).to.be.calledWith('Removing Inertia.on Listener')
            expect(alert.getCall(1)).to.be.calledWith('onBefore')
            expect(alert.getCall(2)).to.be.calledWith('onStart')
          })
      })
    })
  })

  describe('Hooks', () => {
    describe('before', () => {
      it('fires the event when a request is about to be made', () => {
        const assertGlobalEvent = event => {
          expect(event).to.be.an('CustomEvent')
          expect(event.type).to.eq('inertia:before')

          expect(event).to.have.property('cancelable')
          expect(event.cancelable).to.be.true

          expect(event).to.have.property('detail')
          tap(event.detail, detail => {
            expect(detail).to.be.an('object')
            expect(detail).to.have.property('visit')
            assertVisitObject(detail.visit)
          })
        }

        cy.get('.before')
          .click()
          .wait(30)
          .then(() => {
            // Local Event Callback
            expect(alert.getCall(0)).to.be.calledWith('onBefore')
            assertVisitObject(alert.getCall(1).lastArg)

            // Global Inertia Event Listener
            expect(alert.getCall(2)).to.be.calledWith('Inertia.on(before)')
            assertGlobalEvent(alert.getCall(3).lastArg)

            // Global Native Event Listener
            expect(alert.getCall(4)).to.be.calledWith('addEventListener(inertia:before)')
            assertGlobalEvent(alert.getCall(5).lastArg)

            // Ensure the listeners did not prevent the visit
            expect(alert.getCall(6)).to.be.calledWith('onStart')
          })
      })

      describe('Local Event Callbacks', () => {
        it('can prevent the visit by returning false ', () => {
          cy.get('.before-prevent-local')
            .click()
            .wait(30)
            .then(() => {
              expect(alert.getCalls()).to.have.length(1)
              expect(alert.getCall(0)).to.be.calledWith('onBefore')
            })
        })
      })

      describe('Global Inertia.on', () => {
        it('can prevent the visit by returning false ', () => {
          cy.get('.before-prevent-global-inertia')
            .click()
            .wait(30)
            .then(() => {
              expect(alert.getCalls()).to.have.length(3)
              expect(alert.getCall(0)).to.be.calledWith('onBefore')
              expect(alert.getCall(1)).to.be.calledWith('addEventListener(inertia:before)')
              expect(alert.getCall(2)).to.be.calledWith('Inertia.on(before)')
            })
        })
      })

      describe('Global addEventListener', () => {
        it('can prevent the visit by using preventDefault', () => {
          cy.get('.before-prevent-global-native')
            .click()
            .wait(30)
            .then(() => {
              expect(alert.getCalls()).to.have.length(3)
              expect(alert.getCall(0)).to.be.calledWith('onBefore')
              expect(alert.getCall(1)).to.be.calledWith('Inertia.on(before)')
              expect(alert.getCall(2)).to.be.calledWith('addEventListener(inertia:before)')
            })
        })
      })
    })

    describe('cancelToken', () => {
      it('fires when the request is starting', () => {
        const assertCancelToken = token => {
          expect(token).to.be.an('object')
          expect(token).to.have.property('cancel')
        }

        cy.get('.canceltoken')
          .click()
          .wait(30)
          .then(() => {
            // Assert that it only gets fired locally.
            expect(alert.getCalls()).to.have.length(2)

            // Local Event Callback
            expect(alert.getCall(0)).to.be.calledWith('onCancelToken')
            assertCancelToken(alert.getCall(1).lastArg)
          })
      })
    })

    describe('cancel', () => {
      it('fires when the request was cancelled', () => {
        cy.get('.cancel')
          .click()
          .wait(30)
          .then(() => {
            expect(alert.getCalls()).to.have.length(2)
            expect(alert.getCall(0)).to.be.calledWith('onCancel')
            expect(alert.getCall(1)).to.be.calledWith(undefined)
          })
      })
    })

    describe('start', () => {
      it('fires when the request has started', () => {
        const assertGlobalEvent = event => {
          expect(event).to.be.an('CustomEvent')
          expect(event.type).to.eq('inertia:start')

          expect(event).to.have.property('cancelable')
          expect(event.cancelable).to.be.false

          expect(event).to.have.property('detail')
          tap(event.detail, detail => {
            expect(detail).to.be.an('object')
            expect(detail).to.have.property('visit')
            assertVisitObject(detail.visit)
          })
        }

        cy.get('.start')
          .click()
          .wait(30)
          .then(() => {
            expect(alert.getCalls()).to.have.length(6)

            // Global Inertia Event Listener
            expect(alert.getCall(0)).to.be.calledWith('Inertia.on(start)')
            assertGlobalEvent(alert.getCall(1).lastArg)

            // Global Native Event Listener
            expect(alert.getCall(2)).to.be.calledWith('addEventListener(inertia:start)')
            assertGlobalEvent(alert.getCall(3).lastArg)

            // Local Event Callback
            expect(alert.getCall(4)).to.be.calledWith('onStart')
            assertVisitObject(alert.getCall(5).lastArg)
          })
      })
    })

    describe('progress', () => {
      it('fires when the request has files and upload progression occurs', () => {
        const assertGlobalEvent = event => {
          expect(event).to.be.an('CustomEvent')
          expect(event.type).to.eq('inertia:progress')

          expect(event).to.have.property('cancelable')
          expect(event.cancelable).to.be.false

          expect(event).to.have.property('detail')
          tap(event.detail, detail => {
            expect(detail).to.be.an('object')
            expect(detail).to.have.property('progress')
            assertProgressObject(detail.progress)
          })
        }

        cy.get('.progress')
          .click()
          .wait(30)
          .then(() => {
            expect(alert.getCalls()).to.have.length(6)

            // Global Inertia Event Listener
            expect(alert.getCall(0)).to.be.calledWith('Inertia.on(progress)')
            assertGlobalEvent(alert.getCall(1).lastArg)

            // Global Native Event Listener
            expect(alert.getCall(2)).to.be.calledWith('addEventListener(inertia:progress)')
            assertGlobalEvent(alert.getCall(3).lastArg)

            // Local Event Callback
            expect(alert.getCall(4)).to.be.calledWith('onProgress')
            assertProgressObject(alert.getCall(5).lastArg)
          })
      })

      it('does not fire when the request has no files', () => {
        cy.get('.progress-no-files')
          .click()
          .wait(30)
          .then(() => {
            expect(alert.getCalls()).to.have.length(1)
            expect(alert.getCall(0)).to.be.calledWith('progressNoFilesOnBefore')
          })
      })

      describe('error', () => {
        it('fires when the request finishes with validation errors', () => {
          const assertErrorsObject = errors => {
            expect(errors).to.be.an('object')
            expect(errors).to.have.property('foo')
            expect(errors.foo).to.eq('bar')
          }
          const assertGlobalEvent = event => {
            expect(event).to.be.an('CustomEvent')
            expect(event.type).to.eq('inertia:error')

            expect(event).to.have.property('cancelable')
            expect(event.cancelable).to.be.false

            expect(event).to.have.property('detail')
            tap(event.detail, detail => {
              expect(detail).to.be.an('object')
              expect(detail).to.have.property('errors')
              assertErrorsObject(detail.errors)
            })
          }

          cy.get('.error')
            .click()
            .wait(30)
            .then(() => {
              expect(alert.getCalls()).to.have.length(6)

              // Global Inertia Event Listener
              expect(alert.getCall(0)).to.be.calledWith('Inertia.on(error)')
              assertGlobalEvent(alert.getCall(1).lastArg)

              // Global Native Event Listener
              expect(alert.getCall(2)).to.be.calledWith('addEventListener(inertia:error)')
              assertGlobalEvent(alert.getCall(3).lastArg)

              // Local Event Callback
              expect(alert.getCall(4)).to.be.calledWith('onError')
              assertErrorsObject(alert.getCall(5).lastArg)
            })
        })
      })

      describe('Local Event Callbacks', () => {
        it('can delay onFinish from firing by returning a promise', () => {
          cy.get('.error-promise')
            .click()
            .wait(50)
            .then(() => {
              expect(alert.getCall(0)).to.be.calledWith('onError')
              expect(alert.getCall(1)).to.be.calledWith('onFinish should have been fired by now if Promise functionality did not work')
              expect(alert.getCall(2)).to.be.calledWith('onFinish')
            })
        })
      })
    })

    describe('success', () => {
      it('fires when the request finished without validation errors', () => {
        const assertGlobalEvent = event => {
          expect(event).to.be.an('CustomEvent')
          expect(event.type).to.eq('inertia:success')

          expect(event).to.have.property('cancelable')
          expect(event.cancelable).to.be.false

          expect(event).to.have.property('detail')
          tap(event.detail, detail => {
            expect(detail).to.be.an('object')
            expect(detail).to.have.property('page')
            assertPageObject(detail.page)
          })
        }

        cy.get('.success')
          .click()
          .wait(30)
          .then(() => {
            expect(alert.getCalls()).to.have.length(6)

            // Global Inertia Event Listener
            expect(alert.getCall(0)).to.be.calledWith('Inertia.on(success)')
            assertGlobalEvent(alert.getCall(1).lastArg)

            // Global Native Event Listener
            expect(alert.getCall(2)).to.be.calledWith('addEventListener(inertia:success)')
            assertGlobalEvent(alert.getCall(3).lastArg)

            // Local Event Callback
            expect(alert.getCall(4)).to.be.calledWith('onSuccess')
            assertPageObject(alert.getCall(5).lastArg)
          })
      })

      describe('Local Event Callbacks', () => {
        it('can delay onFinish from firing by returning a promise', () => {
          cy.get('.success-promise')
            .click()
            .wait(50)
            .then(() => {
              expect(alert.getCall(0)).to.be.calledWith('onSuccess')
              expect(alert.getCall(1)).to.be.calledWith('onFinish should have been fired by now if Promise functionality did not work')
              expect(alert.getCall(2)).to.be.calledWith('onFinish')
            })
        })
      })
    })

    describe('invalid', () => {
      it('gets fired when a non-Inertia response is received', () => {
        const assertResponseObject = response => {
          expect(response).to.be.an('object')
          expect(response).to.have.property('headers')
          expect(response).to.have.property('data')
          expect(response).to.have.property('status')
        }
        const assertGlobalEvent = event => {
          expect(event).to.be.an('CustomEvent')
          expect(event.type).to.eq('inertia:invalid')

          expect(event).to.have.property('cancelable')
          expect(event.cancelable).to.be.true

          expect(event).to.have.property('detail')
          tap(event.detail, detail => {
            expect(detail).to.be.an('object')
            expect(detail).to.have.property('response')
            assertResponseObject(detail.response)
          })
        }

        cy.get('.invalid')
          .click()
          .wait(50)
          .then(() => {
            expect(alert.getCalls()).to.be.length(4)

            // Global Inertia Event Listener
            expect(alert.getCall(0)).to.be.calledWith('Inertia.on(invalid)')
            assertGlobalEvent(alert.getCall(1).lastArg)

            // Global Native Event Listener
            expect(alert.getCall(2)).to.be.calledWith('addEventListener(inertia:invalid)')
            assertGlobalEvent(alert.getCall(3).lastArg)
          })
      })
    })

    describe('exception', () => {
      it('gets fired when an unexpected situation occurs (e.g. network disconnect)', () => {
        const assertExceptionObject = detail => {
          expect(detail).to.be.an('object')
          expect(detail).to.have.property('exception')
          expect(detail.exception).to.be.an('Error')
        }
        const assertGlobalEvent = event => {
          expect(event).to.be.an('CustomEvent')
          expect(event.type).to.eq('inertia:exception')

          expect(event).to.have.property('cancelable')
          expect(event.cancelable).to.be.true

          expect(event).to.have.property('detail')
          assertExceptionObject(event.detail)
        }

        cy.get('.exception')
          .click()
          .wait(2000) // The browser will 'wait' for a bit when the connection has been dropped server-side.
          .then(() => {
            expect(alert.getCalls()).to.be.length(4)

            // Global Inertia Event Listener
            expect(alert.getCall(0)).to.be.calledWith('Inertia.on(exception)')
            assertGlobalEvent(alert.getCall(1).lastArg)

            // Global Native Event Listener
            expect(alert.getCall(2)).to.be.calledWith('addEventListener(inertia:exception)')
            assertGlobalEvent(alert.getCall(3).lastArg)
          })
      })
    })

    describe('finish', () => {
      it('fires when the request completes', () => {
        const assertGlobalEvent = event => {
          expect(event).to.be.an('CustomEvent')
          expect(event.type).to.eq('inertia:finish')

          expect(event).to.have.property('cancelable')
          expect(event.cancelable).to.be.false

          expect(event).to.have.property('detail')
          tap(event.detail, detail => {
            expect(detail).to.be.an('object')
            expect(detail).to.have.property('visit')
            assertVisitObject(detail.visit)
          })
        }

        cy.get('.finish')
          .click()
          .wait(30)
          .then(() => {
            expect(alert.getCalls()).to.have.length(6)

            // Global Inertia Event Listener
            expect(alert.getCall(0)).to.be.calledWith('Inertia.on(finish)')
            assertGlobalEvent(alert.getCall(1).lastArg)

            // Global Native Event Listener
            expect(alert.getCall(2)).to.be.calledWith('addEventListener(inertia:finish)')
            assertGlobalEvent(alert.getCall(3).lastArg)

            // Local Event Callback
            expect(alert.getCall(4)).to.be.calledWith('onFinish')
            assertVisitObject(alert.getCall(5).lastArg)
          })
      })
    })

    describe('navigate', () => {
      it('fires when the page navigates away after a successful request', () => {
        const assertGlobalEvent = event => {
          expect(event).to.be.an('CustomEvent')
          expect(event.type).to.eq('inertia:navigate')

          expect(event).to.have.property('cancelable')
          expect(event.cancelable).to.be.false

          expect(event).to.have.property('detail')
          tap(event.detail, detail => {
            expect(detail).to.be.an('object')
            expect(detail).to.have.property('page')
            assertPageObject(detail.page)
          })
        }

        cy.get('.navigate')
          .click()
          .wait(30)
          .then(() => {
            expect(alert.getCalls()).to.have.length(4)

            // Global Inertia Event Listener
            expect(alert.getCall(0)).to.be.calledWith('Inertia.on(navigate)')
            assertGlobalEvent(alert.getCall(1).lastArg)

            // Global Native Event Listener
            expect(alert.getCall(2)).to.be.calledWith('addEventListener(inertia:navigate)')
            assertGlobalEvent(alert.getCall(3).lastArg)
          })
      })
    })
  })

  describe('Lifecycles', () => {
    it('fires all expected events in the correct order on a successful request', () => {
      cy.get('.lifecycle-success')
        .click()
        .wait(30)
        .then(() => {
          expect(alert.getCalls()).to.have.length(16)

          expect(alert.getCall(0)).to.be.calledWith('onBefore')
          expect(alert.getCall(1)).to.be.calledWith('Inertia.on(before)')
          expect(alert.getCall(2)).to.be.calledWith('addEventListener(inertia:before)')

          expect(alert.getCall(3)).to.be.calledWith('onCancelToken')

          expect(alert.getCall(4)).to.be.calledWith('Inertia.on(start)')
          expect(alert.getCall(5)).to.be.calledWith('addEventListener(inertia:start)')
          expect(alert.getCall(6)).to.be.calledWith('onStart')

          expect(alert.getCall(7)).to.be.calledWith('Inertia.on(progress)')
          expect(alert.getCall(8)).to.be.calledWith('addEventListener(inertia:progress)')
          expect(alert.getCall(9)).to.be.calledWith('onProgress')

          expect(alert.getCall(10)).to.be.calledWith('Inertia.on(success)')
          expect(alert.getCall(11)).to.be.calledWith('addEventListener(inertia:success)')
          expect(alert.getCall(12)).to.be.calledWith('onSuccess')

          expect(alert.getCall(13)).to.be.calledWith('Inertia.on(finish)')
          expect(alert.getCall(14)).to.be.calledWith('addEventListener(inertia:finish)')
          expect(alert.getCall(15)).to.be.calledWith('onFinish')
        })
    })

    it('fires all expected events in the correct order on an error request', () => {
      cy.get('.lifecycle-error')
        .click()
        .wait(30)
        .then(() => {
          expect(alert.getCalls()).to.have.length(18)

          expect(alert.getCall(0)).to.be.calledWith('onBefore')
          expect(alert.getCall(1)).to.be.calledWith('Inertia.on(before)')
          expect(alert.getCall(2)).to.be.calledWith('addEventListener(inertia:before)')

          expect(alert.getCall(3)).to.be.calledWith('onCancelToken')

          expect(alert.getCall(4)).to.be.calledWith('Inertia.on(start)')
          expect(alert.getCall(5)).to.be.calledWith('addEventListener(inertia:start)')
          expect(alert.getCall(6)).to.be.calledWith('onStart')

          expect(alert.getCall(7)).to.be.calledWith('Inertia.on(progress)')
          expect(alert.getCall(8)).to.be.calledWith('addEventListener(inertia:progress)')
          expect(alert.getCall(9)).to.be.calledWith('onProgress')

          // Firing, because the page URL is different even though the component is the same.
          expect(alert.getCall(10)).to.be.calledWith('Inertia.on(navigate)')
          expect(alert.getCall(11)).to.be.calledWith('addEventListener(inertia:navigate)')

          expect(alert.getCall(12)).to.be.calledWith('Inertia.on(error)')
          expect(alert.getCall(13)).to.be.calledWith('addEventListener(inertia:error)')
          expect(alert.getCall(14)).to.be.calledWith('onError')

          expect(alert.getCall(15)).to.be.calledWith('Inertia.on(finish)')
          expect(alert.getCall(16)).to.be.calledWith('addEventListener(inertia:finish)')
          expect(alert.getCall(17)).to.be.calledWith('onFinish')
        })
    })

    describe('Cancelling', () => {
      it('cancels a visit before it completes', () => {
        cy.get('.lifecycle-cancel')
          .click()
          .wait(30)
          .then(() => {
            expect(alert.getCalls()).to.have.length(12)

            expect(alert.getCall(0)).to.be.calledWith('onBefore')
            expect(alert.getCall(1)).to.be.calledWith('Inertia.on(before)')
            expect(alert.getCall(2)).to.be.calledWith('addEventListener(inertia:before)')

            expect(alert.getCall(3)).to.be.calledWith('onCancelToken')

            expect(alert.getCall(4)).to.be.calledWith('Inertia.on(start)')
            expect(alert.getCall(5)).to.be.calledWith('addEventListener(inertia:start)')
            expect(alert.getCall(6)).to.be.calledWith('onStart')

            expect(alert.getCall(7)).to.be.calledWith('CANCELLING!')
            expect(alert.getCall(8)).to.be.calledWith('onCancel')

            expect(alert.getCall(9)).to.be.calledWith('Inertia.on(finish)')
            expect(alert.getCall(10)).to.be.calledWith('addEventListener(inertia:finish)')
            expect(alert.getCall(11)).to.be.calledWith('onFinish')
          })
      })

      it('prevents onCancel from firing when the request is already finished', () => {
        cy.get('.lifecycle-cancel-after-finish')
          .click()
          .wait(30)
          .then(() => {
            expect(alert.getCalls()).to.have.length(17)

            expect(alert.getCall(0)).to.be.calledWith('onBefore')
            expect(alert.getCall(1)).to.be.calledWith('Inertia.on(before)')
            expect(alert.getCall(2)).to.be.calledWith('addEventListener(inertia:before)')

            expect(alert.getCall(3)).to.be.calledWith('onCancelToken')

            expect(alert.getCall(4)).to.be.calledWith('Inertia.on(start)')
            expect(alert.getCall(5)).to.be.calledWith('addEventListener(inertia:start)')
            expect(alert.getCall(6)).to.be.calledWith('onStart')

            expect(alert.getCall(7)).to.be.calledWith('Inertia.on(progress)')
            expect(alert.getCall(8)).to.be.calledWith('addEventListener(inertia:progress)')
            expect(alert.getCall(9)).to.be.calledWith('onProgress')

            expect(alert.getCall(10)).to.be.calledWith('Inertia.on(success)')
            expect(alert.getCall(11)).to.be.calledWith('addEventListener(inertia:success)')
            expect(alert.getCall(12)).to.be.calledWith('onSuccess')

            expect(alert.getCall(13)).to.be.calledWith('Inertia.on(finish)')
            expect(alert.getCall(14)).to.be.calledWith('addEventListener(inertia:finish)')
            expect(alert.getCall(15)).to.be.calledWith('onFinish')

            expect(alert.getCall(16)).to.be.calledWith('CANCELLING!')
          })
      })
    })
  })
})
