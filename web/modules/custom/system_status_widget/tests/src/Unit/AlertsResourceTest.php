<?php

namespace Drupal\Tests\system_status_widget\Unit;

use Drupal\Tests\UnitTestCase;
use Drupal\system_status_widget\Plugin\rest\resource\AlertsResource;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/**
 * @coversDefaultClass \Drupal\system_status_widget\Plugin\rest\resource\AlertsResource
 * @group system_status_widget
 */
class AlertsResourceTest extends UnitTestCase {

  protected $alertsResource;
  protected $cacheInvalidator;

  protected function setUp(): void {
    parent::setUp();
    
    // Setup dependency mocks
    $this->cacheInvalidator = $this->createMock('\Drupal\Core\Cache\CacheTagsInvalidatorInterface');
    
    // Construct target Alerts Resource
    $this->alertsResource = new AlertsResource(
      [],
      'alerts_resource',
      ['label' => 'Alerts API'],
      ['json'],
      $this->createMock('\Psr\Log\LoggerInterface')
    );
  }

  /**
   * Test post request with missing authorization headers throws access denied.
   */
  public function testPostMissingAuthorization() {
    $this->expectException(AccessDeniedHttpException::class);
    
    $request = new Request();
    $data = ['alert_level' => 'critical', 'message' => 'Datacenter downtime'];
    
    $this->alertsResource->post($data, $request);
  }

  /**
   * Test post request with invalid payload content throws bad request.
   */
  public function testPostInvalidPayload() {
    $this->expectException(BadRequestHttpException::class);
    
    $request = new Request();
    $request->headers->set('Authorization', 'Bearer dummy-token-value');
    
    // Missing required alert_level field
    $data = ['message' => 'Service offline'];
    
    $this->alertsResource->post($data, $request);
  }
}
